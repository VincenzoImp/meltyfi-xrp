import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";

/**
 * Deploys the complete MeltyFi protocol for XRP EVM using Hardhat Deploy and OpenZeppelin Upgrades
 *
 * Deployment order:
 * 1. ChocoChip (governance token)
 * 2. WonkaBar (lottery tickets)
 * 3. PseudoRandomGenerator (on-chain randomness)
 * 4. MeltyTimelock (governance timelock)
 * 5. MeltyFiProtocol (main protocol)
 * 6. MeltyDAO (governance)
 * 7. Setup roles and authorizations
 *
 * @param hre HardhatRuntimeEnvironment object
 */
const deployMeltyFi: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { log } = hre.deployments;

  log("========================================");
  log("Starting MeltyFi Protocol Deployment (XRP EVM)");
  log("========================================");

  // Band Protocol Oracle for XRP/USD price feed
  // Official Band Protocol StdReferenceProxy addresses for XRPL EVM Sidechain:
  // Mainnet: 0x6ec95bC946DcC7425925801F4e262092E0d1f83b
  // Testnet: 0x8c064bCf7C0DA3B3b090BAbFE8f3323534D84d68
  const BAND_ORACLE_ADDRESS =
    hre.network.name === "xrpEvmMainnet"
      ? "0x6ec95bC946DcC7425925801F4e262092E0d1f83b"
      : "0x8c064bCf7C0DA3B3b090BAbFE8f3323534D84d68"; // Default to testnet

  // DAO Treasury (deployer initially, should transfer to multisig later)
  const DAO_TREASURY = deployer;

  log("\n1. Deploying ChocoChip Token (Governance)...");
  const ChocoChip = await ethers.getContractFactory("ChocoChip");
  const chocoChip = await upgrades.deployProxy(ChocoChip, [deployer], {
    initializer: "initialize",
    kind: "uups",
  });
  await chocoChip.waitForDeployment();
  const chocoChipAddress = await chocoChip.getAddress();
  log(`✓ ChocoChip deployed to: ${chocoChipAddress}`);

  log("\n2. Deploying WonkaBar Token (Lottery Tickets)...");
  const WonkaBar = await ethers.getContractFactory("WonkaBar");
  const wonkaBar = await upgrades.deployProxy(WonkaBar, [deployer, "https://meltyfi.io/api/wonkabar/"], {
    initializer: "initialize",
    kind: "uups",
  });
  await wonkaBar.waitForDeployment();
  const wonkaBarAddress = await wonkaBar.getAddress();
  log(`✓ WonkaBar deployed to: ${wonkaBarAddress}`);

  log("\n3. Deploying PseudoRandomGenerator (On-chain RNG)...");
  const PseudoRandomGenerator = await ethers.getContractFactory("PseudoRandomGenerator");
  const randomGenerator = await upgrades.deployProxy(PseudoRandomGenerator, [deployer, ethers.ZeroAddress], {
    initializer: "initialize",
    kind: "uups",
  });
  await randomGenerator.waitForDeployment();
  const randomGeneratorAddress = await randomGenerator.getAddress();

  log(`✓ PseudoRandomGenerator deployed to: ${randomGeneratorAddress}`);

  log("\n4. Deploying MeltyTimelock (Governance Timelock)...");
  const MeltyTimelock = await ethers.getContractFactory("MeltyTimelock");

  // For initial deployment, deployer is proposer/executor
  // After DAO deployment, we'll update these roles
  const timelockProposers: string[] = [deployer]; // Will add DAO later
  const timelockExecutors: string[] = [deployer]; // Will add DAO later
  const timelockCancellers: string[] = [deployer]; // Emergency multisig

  const timelock = await upgrades.deployProxy(
    MeltyTimelock,
    [deployer, timelockProposers, timelockExecutors, timelockCancellers],
    {
      initializer: "initialize",
      kind: "uups",
    },
  );
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  log(`✓ MeltyTimelock deployed to: ${timelockAddress}`);

  log("\n5. Deploying MeltyFiProtocol (Main Protocol)...");
  const MeltyFiProtocol = await ethers.getContractFactory("MeltyFiProtocol");
  const protocol = await upgrades.deployProxy(
    MeltyFiProtocol,
    [deployer, chocoChipAddress, wonkaBarAddress, randomGeneratorAddress, BAND_ORACLE_ADDRESS, DAO_TREASURY],
    {
      initializer: "initialize",
      kind: "uups",
    },
  );
  await protocol.waitForDeployment();
  const protocolAddress = await protocol.getAddress();
  log(`✓ MeltyFiProtocol deployed to: ${protocolAddress}`);

  log("\n6. Deploying MeltyDAO (Governance)...");
  const MeltyDAO = await ethers.getContractFactory("MeltyDAO");
  const dao = await upgrades.deployProxy(MeltyDAO, [chocoChipAddress, timelockAddress, timelockAddress], {
    initializer: "initialize",
    kind: "uups",
  });
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  log(`✓ MeltyDAO deployed to: ${daoAddress}`);

  log("\n7. Deploying Test NFT Collection (for testing/demo)...");
  const TestNFT = await ethers.getContractFactory("TestNFT");
  const testNFT = await TestNFT.deploy(
    "MeltyFi Test NFTs",
    "MELTY",
    "https://api.meltyfi.io/metadata/", // Base URI for metadata
  );
  await testNFT.waitForDeployment();
  const testNFTAddress = await testNFT.getAddress();
  log(`✓ TestNFT deployed to: ${testNFTAddress}`);

  log("\n8. Setting up roles and authorizations...");

  // Authorize MeltyFiProtocol as ChocoChip minter
  log("   - Authorizing MeltyFiProtocol as ChocoChip minter...");
  await chocoChip.authorizeMinter(protocolAddress);

  // Set MeltyFiProtocol address in WonkaBar
  log("   - Setting MeltyFiProtocol in WonkaBar...");
  await wonkaBar.setMeltyFiProtocol(protocolAddress);

  // Update MeltyFiProtocol address in PseudoRandomGenerator
  log("   - Setting MeltyFiProtocol in PseudoRandomGenerator...");
  await randomGenerator.updateMeltyFiProtocol(protocolAddress);

  // Grant timelock roles to DAO
  log("   - Granting DAO proposer/executor roles...");
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  await timelock.grantRole(PROPOSER_ROLE, daoAddress);
  await timelock.grantRole(EXECUTOR_ROLE, daoAddress);

  // Transfer ownership of upgradeable contracts to timelock
  log("   - Transferring ownership to Timelock...");
  await chocoChip.transferOwnership(timelockAddress);
  await wonkaBar.transferOwnership(timelockAddress);
  await protocol.transferOwnership(timelockAddress);
  await randomGenerator.transferOwnership(timelockAddress);
  // DAO is already owned by timelock (set in initialize)
  log("   ✓ Ownership transferred successfully");

  log("\n========================================");
  log("MeltyFi Protocol Deployment Complete!");
  log("========================================");
  log("\nDeployed Contracts:");
  log(`  ChocoChip:              ${chocoChipAddress}`);
  log(`  WonkaBar:               ${wonkaBarAddress}`);
  log(`  PseudoRandomGenerator:  ${randomGeneratorAddress}`);
  log(`  MeltyTimelock:          ${timelockAddress}`);
  log(`  MeltyFiProtocol:        ${protocolAddress}`);
  log(`  MeltyDAO:               ${daoAddress}`);
  log(`  TestNFT:                ${testNFTAddress}`);
  log("\nNext Steps:");
  log("  1. Visit the Free Mint page to mint test NFTs");
  log("  2. Create lotteries with your minted NFTs");
  log("  3. Verify Band Protocol oracle address (currently: ${BAND_ORACLE_ADDRESS})");
  log("  4. Note: Using pseudo-random generation (not cryptographically secure)");
  log("========================================\n");

  // Save deployment info for frontend
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    blockchain: "XRP EVM",
    contracts: {
      ChocoChip: chocoChipAddress,
      WonkaBar: wonkaBarAddress,
      PseudoRandomGenerator: randomGeneratorAddress,
      BandOracle: BAND_ORACLE_ADDRESS,
      MeltyTimelock: timelockAddress,
      MeltyFiProtocol: protocolAddress,
      MeltyDAO: daoAddress,
      TestNFT: testNFTAddress,
    },
    parameters: {
      protocolFee: "5%",
      maxWonkaBars: 100,
      minWonkaBars: 5,
      maxBalance: "25%",
      chocoChipsRewardPercentage: "10% of XRP USD value",
      votingDelay: "1 block",
      votingPeriod: "50,400 blocks (~7 days)",
      proposalThreshold: "100,000 CHOC",
      quorum: "4%",
      timelockDelay: "48 hours",
    },
  };

  // Save deployment info for frontend
  const fs = await import("fs");
  const path = await import("path");
  const deploymentsDir = path.join(__dirname, "..", "deployments", hre.network.name);
  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(path.join(deploymentsDir, "meltyfi.json"), JSON.stringify(deploymentInfo, null, 2));

  // Auto-update contracts.ts file with new addresses
  try {
    const contractsFilePath = path.join(__dirname, "..", "..", "nextjs", "lib", "contracts.ts");

    if (fs.existsSync(contractsFilePath)) {
      let contractsFileContent = fs.readFileSync(contractsFilePath, "utf8");

      // Map network names
      const networkMapping: Record<string, string> = {
        localhost: "localhost",
        hardhat: "localhost",
        xrplEvmTestnet: "xrplEvmTestnet",
        xrplEvmMainnet: "xrplEvmMainnet",
      };

      const targetNetwork = networkMapping[hre.network.name] || "localhost";

      // Build the new network configuration
      const newNetworkConfig = `  ${targetNetwork}: {
    ChocoChip: "${chocoChipAddress}" as Address,
    WonkaBar: "${wonkaBarAddress}" as Address,
    PseudoRandomGenerator: "${randomGeneratorAddress}" as Address,
    MeltyTimelock: "${timelockAddress}" as Address,
    MeltyFiProtocol: "${protocolAddress}" as Address,
    MeltyDAO: "${daoAddress}" as Address,
    TestNFT: "${testNFTAddress}" as Address,
  },`;

      // Use regex to replace the network configuration
      const networkPattern = new RegExp(
        `  ${targetNetwork}:\\s*{[^}]*ChocoChip:[^}]*WonkaBar:[^}]*PseudoRandomGenerator:[^}]*MeltyTimelock:[^}]*MeltyFiProtocol:[^}]*MeltyDAO:[^}]*TestNFT:[^}]*},`,
        "s",
      );

      if (networkPattern.test(contractsFileContent)) {
        contractsFileContent = contractsFileContent.replace(networkPattern, newNetworkConfig);
        fs.writeFileSync(contractsFilePath, contractsFileContent, "utf8");
        log(`\n✅ Auto-updated contract addresses in contracts.ts for ${targetNetwork}`);
      }
    }
  } catch (error) {
    log(`\n⚠️  Could not auto-update contracts.ts: ${error}`);
  }

  return true;
};

export default deployMeltyFi;

// Tags for selective deployment
deployMeltyFi.tags = ["MeltyFi", "all"];
deployMeltyFi.id = "deploy_meltyfi_protocol";
