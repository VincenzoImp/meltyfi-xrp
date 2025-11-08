import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ChocoChip, WonkaBar, VRFManager, MeltyFiProtocol } from "../typechain-types";

describe("MeltyFi Protocol", function () {
  let chocoChip: ChocoChip;
  let wonkaBar: WonkaBar;
  let vrfManager: VRFManager;
  let protocol: MeltyFiProtocol;

  let owner: SignerWithAddress;
  let nftOwner: SignerWithAddress;
  let participant1: SignerWithAddress;
  let participant2: SignerWithAddress;
  let treasury: SignerWithAddress;

  // Mock NFT for testing
  let mockNFT: any;

  const VRF_COORDINATOR = "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B";
  const WONKA_BAR_PRICE = ethers.parseEther("0.1");
  const WONKA_BARS_SUPPLY = 10;
  const DURATION_DAYS = 7;

  before(async function () {
    [owner, nftOwner, participant1, participant2, treasury] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // Deploy Mock NFT
    const MockNFT = await ethers.getContractFactory("MockERC721");
    mockNFT = await MockNFT.deploy();
    await mockNFT.waitForDeployment();

    // Mint NFT to nftOwner
    await mockNFT.mint(nftOwner.address, 1);

    // Deploy ChocoChip
    const ChocoChip = await ethers.getContractFactory("ChocoChip");
    chocoChip = (await upgrades.deployProxy(ChocoChip, [owner.address], {
      initializer: "initialize",
      kind: "uups",
    })) as unknown as ChocoChip;

    // Deploy WonkaBar
    const WonkaBar = await ethers.getContractFactory("WonkaBar");
    wonkaBar = (await upgrades.deployProxy(WonkaBar, [owner.address, "https://test.com/"], {
      initializer: "initialize",
      kind: "uups",
    })) as unknown as WonkaBar;

    // Deploy VRFManager
    const VRFManager = await ethers.getContractFactory("VRFManager");
    const vrfConfig = {
      keyHash: ethers.randomBytes(32),
      subscriptionId: 1,
      callbackGasLimit: 200000,
      requestConfirmations: 3,
      numWords: 1,
    };
    vrfManager = (await VRFManager.deploy(VRF_COORDINATOR, vrfConfig)) as VRFManager;

    // Deploy Timelock
    const MeltyTimelock = await ethers.getContractFactory("MeltyTimelock");
    await upgrades.deployProxy(MeltyTimelock, [owner.address, [owner.address], [owner.address], [owner.address]], {
      initializer: "initialize",
      kind: "uups",
    });

    // Deploy Protocol
    const MeltyFiProtocol = await ethers.getContractFactory("MeltyFiProtocol");
    protocol = (await upgrades.deployProxy(
      MeltyFiProtocol,
      [
        owner.address,
        await chocoChip.getAddress(),
        await wonkaBar.getAddress(),
        await vrfManager.getAddress(),
        treasury.address,
      ],
      {
        initializer: "initialize",
        kind: "uups",
      },
    )) as unknown as MeltyFiProtocol;

    // Setup authorizations
    await chocoChip.authorizeMinter(await protocol.getAddress());
    await wonkaBar.setMeltyFiProtocol(await protocol.getAddress());
    await vrfManager.setMeltyFiProtocol(await protocol.getAddress());
  });

  describe("Contract Deployment", function () {
    it("Should deploy all contracts successfully", async function () {
      expect(await chocoChip.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await wonkaBar.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await vrfManager.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await protocol.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should set correct initial parameters", async function () {
      expect(await protocol.protocolFeePercentage()).to.equal(500); // 5%
      expect(await protocol.maxWonkaBarsPerLottery()).to.equal(100);
      expect(await protocol.minWonkaBarsPerLottery()).to.equal(5);
      expect(await protocol.chocoChipsPerEther()).to.equal(ethers.parseEther("1000"));
    });

    it("Should have ChocoChip max supply set correctly", async function () {
      expect(await chocoChip.MAX_SUPPLY()).to.equal(ethers.parseEther("1000000000"));
    });
  });

  describe("Lottery Creation", function () {
    it("Should create a lottery with valid NFT", async function () {
      const nftAddress = await mockNFT.getAddress();

      // Approve NFT transfer
      await mockNFT.connect(nftOwner).approve(await protocol.getAddress(), 1);

      // Create lottery
      const tx = await protocol
        .connect(nftOwner)
        .createLottery(
          nftAddress,
          1,
          WONKA_BAR_PRICE,
          WONKA_BARS_SUPPLY,
          DURATION_DAYS,
          "Test NFT",
          "https://test.com/nft.png",
        );

      await expect(tx)
        .to.emit(protocol, "LotteryCreated")
        .withArgs(
          0,
          nftOwner.address,
          nftAddress,
          1,
          WONKA_BAR_PRICE,
          WONKA_BARS_SUPPLY,
          (await time.latest()) + DURATION_DAYS * 24 * 60 * 60,
        );

      // Verify lottery was created
      const lottery = await protocol.getLottery(0);
      expect(lottery.owner).to.equal(nftOwner.address);
      expect(lottery.nftContract).to.equal(nftAddress);
      expect(lottery.wonkaBarPrice).to.equal(WONKA_BAR_PRICE);
      expect(lottery.state).to.equal(0); // ACTIVE
    });

    it("Should reject lottery creation if caller doesn't own NFT", async function () {
      const nftAddress = await mockNFT.getAddress();

      await expect(
        protocol
          .connect(participant1)
          .createLottery(
            nftAddress,
            1,
            WONKA_BAR_PRICE,
            WONKA_BARS_SUPPLY,
            DURATION_DAYS,
            "Test NFT",
            "https://test.com/nft.png",
          ),
      ).to.be.revertedWithCustomError(protocol, "NotNFTOwner");
    });

    it("Should reject lottery with invalid supply", async function () {
      const nftAddress = await mockNFT.getAddress();
      await mockNFT.connect(nftOwner).approve(await protocol.getAddress(), 1);

      // Too few
      await expect(
        protocol
          .connect(nftOwner)
          .createLottery(nftAddress, 1, WONKA_BAR_PRICE, 2, DURATION_DAYS, "Test NFT", "https://test.com/nft.png"),
      ).to.be.revertedWithCustomError(protocol, "InvalidSupply");

      // Too many
      await expect(
        protocol
          .connect(nftOwner)
          .createLottery(nftAddress, 1, WONKA_BAR_PRICE, 150, DURATION_DAYS, "Test NFT", "https://test.com/nft.png"),
      ).to.be.revertedWithCustomError(protocol, "InvalidSupply");
    });
  });

  describe("WonkaBar Purchase", function () {
    let lotteryId: number;

    beforeEach(async function () {
      const nftAddress = await mockNFT.getAddress();
      await mockNFT.connect(nftOwner).approve(await protocol.getAddress(), 1);

      await protocol
        .connect(nftOwner)
        .createLottery(
          nftAddress,
          1,
          WONKA_BAR_PRICE,
          WONKA_BARS_SUPPLY,
          DURATION_DAYS,
          "Test NFT",
          "https://test.com/nft.png",
        );

      lotteryId = 0;
    });

    it("Should allow purchasing WonkaBars", async function () {
      const amount = 2;
      const totalCost = WONKA_BAR_PRICE * BigInt(amount);

      await protocol.connect(participant1).buyWonkaBars(lotteryId, amount, { value: totalCost });

      // Check WonkaBar balance
      expect(await wonkaBar.balanceOf(participant1.address, lotteryId)).to.equal(amount);

      // Check ChocoChip rewards (1000 CHOC per 1 ETH)
      const expectedChoco = (totalCost * ethers.parseEther("1000")) / ethers.parseEther("1");
      expect(await chocoChip.balanceOf(participant1.address)).to.equal(expectedChoco);
    });

    it("Should split payment correctly (95% owner, 5% DAO)", async function () {
      const amount = 2;
      const totalCost = WONKA_BAR_PRICE * BigInt(amount);

      const ownerBalanceBefore = await ethers.provider.getBalance(nftOwner.address);
      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);

      await protocol.connect(participant1).buyWonkaBars(lotteryId, amount, { value: totalCost });

      const ownerBalanceAfter = await ethers.provider.getBalance(nftOwner.address);
      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);

      const ownerReceived = ownerBalanceAfter - ownerBalanceBefore;
      const treasuryReceived = treasuryBalanceAfter - treasuryBalanceBefore;

      const expectedOwnerAmount = (totalCost * BigInt(9500)) / BigInt(10000); // 95%
      const expectedTreasuryAmount = (totalCost * BigInt(500)) / BigInt(10000); // 5%

      expect(ownerReceived).to.equal(expectedOwnerAmount);
      expect(treasuryReceived).to.equal(expectedTreasuryAmount);
    });

    it("Should reject purchase with insufficient payment", async function () {
      const amount = 2;
      const totalCost = WONKA_BAR_PRICE * BigInt(amount);
      const insufficientAmount = totalCost - BigInt(1);

      await expect(
        protocol.connect(participant1).buyWonkaBars(lotteryId, amount, { value: insufficientAmount }),
      ).to.be.revertedWithCustomError(protocol, "InsufficientPayment");
    });

    it("Should reject purchase exceeding max supply", async function () {
      const amount = WONKA_BARS_SUPPLY + 1;
      const totalCost = WONKA_BAR_PRICE * BigInt(amount);

      await expect(
        protocol.connect(participant1).buyWonkaBars(lotteryId, amount, { value: totalCost }),
      ).to.be.revertedWithCustomError(protocol, "ExceedsMaxSupply");
    });

    it("Should enforce max balance percentage (25%)", async function () {
      const maxAllowed = Math.floor((WONKA_BARS_SUPPLY * 25) / 100); // 2.5, rounds to 2
      const totalCost = WONKA_BAR_PRICE * BigInt(maxAllowed + 1);

      await expect(
        protocol.connect(participant1).buyWonkaBars(lotteryId, maxAllowed + 1, { value: totalCost }),
      ).to.be.revertedWithCustomError(protocol, "ExceedsMaxBalance");
    });
  });

  describe("Loan Repayment", function () {
    let lotteryId: number;

    beforeEach(async function () {
      const nftAddress = await mockNFT.getAddress();
      await mockNFT.connect(nftOwner).approve(await protocol.getAddress(), 1);

      await protocol
        .connect(nftOwner)
        .createLottery(
          nftAddress,
          1,
          WONKA_BAR_PRICE,
          WONKA_BARS_SUPPLY,
          DURATION_DAYS,
          "Test NFT",
          "https://test.com/nft.png",
        );

      lotteryId = 0;

      // Participant buys some WonkaBars
      const amount = 2;
      const totalCost = WONKA_BAR_PRICE * BigInt(amount);
      await protocol.connect(participant1).buyWonkaBars(lotteryId, amount, { value: totalCost });
    });

    it("Should allow owner to repay loan and get NFT back", async function () {
      const lottery = await protocol.getLottery(lotteryId);
      const repaymentAmount = lottery.totalRaised;

      const tx = await protocol.connect(nftOwner).repayLoan(lotteryId, { value: repaymentAmount });

      await expect(tx).to.emit(protocol, "LoanRepaid").withArgs(lotteryId, nftOwner.address, repaymentAmount);

      // Check NFT returned to owner
      expect(await mockNFT.ownerOf(1)).to.equal(nftOwner.address);

      // Check lottery state changed to CANCELLED
      const updatedLottery = await protocol.getLottery(lotteryId);
      expect(updatedLottery.state).to.equal(1); // CANCELLED
    });

    it("Should reject repayment from non-owner", async function () {
      const lottery = await protocol.getLottery(lotteryId);
      const repaymentAmount = lottery.totalRaised;

      await expect(
        protocol.connect(participant1).repayLoan(lotteryId, { value: repaymentAmount }),
      ).to.be.revertedWithCustomError(protocol, "NotLotteryOwner");
    });

    it("Should reject incorrect repayment amount", async function () {
      const lottery = await protocol.getLottery(lotteryId);
      const incorrectAmount = lottery.totalRaised - BigInt(1);

      await expect(
        protocol.connect(nftOwner).repayLoan(lotteryId, { value: incorrectAmount }),
      ).to.be.revertedWithCustomError(protocol, "IncorrectRepaymentAmount");
    });
  });

  describe("Protocol Parameters", function () {
    it("Should allow owner to update protocol fee", async function () {
      const newFee = 600; // 6%
      await protocol.setProtocolFee(newFee);
      expect(await protocol.protocolFeePercentage()).to.equal(newFee);
    });

    it("Should allow owner to update max WonkaBars", async function () {
      const newMax = 150;
      await protocol.setMaxWonkaBars(newMax);
      expect(await protocol.maxWonkaBarsPerLottery()).to.equal(newMax);
    });

    it("Should reject parameter updates from non-owner", async function () {
      await expect(protocol.connect(participant1).setProtocolFee(600)).to.be.reverted;
    });
  });

  describe("View Functions", function () {
    let lotteryId: number;

    beforeEach(async function () {
      const nftAddress = await mockNFT.getAddress();
      await mockNFT.connect(nftOwner).approve(await protocol.getAddress(), 1);

      await protocol
        .connect(nftOwner)
        .createLottery(
          nftAddress,
          1,
          WONKA_BAR_PRICE,
          WONKA_BARS_SUPPLY,
          DURATION_DAYS,
          "Test NFT",
          "https://test.com/nft.png",
        );

      lotteryId = 0;

      // Participants buy WonkaBars (max 25% each = 2.5, rounds to 2)
      await protocol.connect(participant1).buyWonkaBars(lotteryId, 2, { value: WONKA_BAR_PRICE * BigInt(2) });
      await protocol.connect(participant2).buyWonkaBars(lotteryId, 2, { value: WONKA_BAR_PRICE * BigInt(2) });
    });

    it("Should return active lotteries", async function () {
      const activeLotteries = await protocol.getActiveLotteries();
      expect(activeLotteries.length).to.equal(1);
      expect(activeLotteries[0]).to.equal(0);
    });

    it("Should return user lotteries", async function () {
      const userLotteries = await protocol.getUserLotteries(nftOwner.address);
      expect(userLotteries.length).to.equal(1);
      expect(userLotteries[0]).to.equal(0);
    });

    it("Should return user participations", async function () {
      const participations = await protocol.getUserParticipations(participant1.address);
      expect(participations.length).to.equal(1);
      expect(participations[0]).to.equal(0);
    });

    it("Should calculate win probability correctly", async function () {
      // Participant1 has 2/4 = 50% chance
      const probability = await protocol.calculateWinProbability(participant1.address, lotteryId);
      expect(probability).to.equal(5000); // 50% in basis points
    });

    it("Should return protocol stats", async function () {
      const stats = await protocol.getProtocolStats();
      expect(stats[0]).to.equal(1); // totalLotteries
      expect(stats[1]).to.equal(1); // activeLotteries
    });
  });
});
