import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";

/**
 * Deploys the complete MeltyFi protocol using Hardhat Deploy and OpenZeppelin Upgrades
 *
 * Deployment order:
 * 1. ChocoChip (governance token)
 * 2. WonkaBar (lottery tickets)
 * 3. VRFManager (randomness)
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
  log("Starting MeltyFi Protocol Deployment");
  log("========================================");

  // VRF Configuration (these should be set based on network)
  // These are placeholder values - update for production
  const VRF_COORDINATOR = "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B"; // Sepolia testnet
  const VRF_KEY_HASH = "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae";
  const VRF_SUBSCRIPTION_ID = 1; // Create subscription on Chainlink
  const VRF_CALLBACK_GAS_LIMIT = 200000;
  const VRF_REQUEST_CONFIRMATIONS = 3;
  const VRF_NUM_WORDS = 1;

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

  log("\n3. Deploying VRFManager (Chainlink VRF)...");
  const VRFManager = await ethers.getContractFactory("VRFManager");
  const vrfConfig = {
    keyHash: VRF_KEY_HASH,
    subscriptionId: VRF_SUBSCRIPTION_ID,
    callbackGasLimit: VRF_CALLBACK_GAS_LIMIT,
    requestConfirmations: VRF_REQUEST_CONFIRMATIONS,
    numWords: VRF_NUM_WORDS,
  };

  // Deploy VRFManager with config in constructor
  const vrfManager = await VRFManager.deploy(VRF_COORDINATOR, vrfConfig);
  await vrfManager.waitForDeployment();
  const vrfManagerAddress = await vrfManager.getAddress();

  log(`✓ VRFManager deployed to: ${vrfManagerAddress}`);

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
    [deployer, chocoChipAddress, wonkaBarAddress, vrfManagerAddress, DAO_TREASURY],
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

  log("\n7. Setting up roles and authorizations...");

  // Authorize MeltyFiProtocol as ChocoChip minter
  log("   - Authorizing MeltyFiProtocol as ChocoChip minter...");
  await chocoChip.authorizeMinter(protocolAddress);

  // Set MeltyFiProtocol address in WonkaBar
  log("   - Setting MeltyFiProtocol in WonkaBar...");
  await wonkaBar.setMeltyFiProtocol(protocolAddress);

  // Set MeltyFiProtocol address in VRFManager
  log("   - Setting MeltyFiProtocol in VRFManager...");
  await vrfManager.setMeltyFiProtocol(protocolAddress);

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
  // VRFManager uses Chainlink's ownership (not transferred)
  // DAO is already owned by timelock (set in initialize)
  log("   ✓ Ownership transferred successfully");

  log("\n========================================");
  log("MeltyFi Protocol Deployment Complete!");
  log("========================================");
  log("\nDeployed Contracts:");
  log(`  ChocoChip:         ${chocoChipAddress}`);
  log(`  WonkaBar:          ${wonkaBarAddress}`);
  log(`  VRFManager:        ${vrfManagerAddress}`);
  log(`  MeltyTimelock:     ${timelockAddress}`);
  log(`  MeltyFiProtocol:   ${protocolAddress}`);
  log(`  MeltyDAO:          ${daoAddress}`);
  log("\nNext Steps:");
  log("  1. Fund VRF subscription with LINK tokens");
  log("  2. Add VRFManager as consumer to VRF subscription");
  log("  3. Update DAO treasury address if needed");
  log("  4. Deploy frontend and configure contract addresses");
  log("  5. Run comprehensive tests");
  log("========================================\n");

  // Save deployment info for frontend
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      ChocoChip: chocoChipAddress,
      WonkaBar: wonkaBarAddress,
      VRFManager: vrfManagerAddress,
      MeltyTimelock: timelockAddress,
      MeltyFiProtocol: protocolAddress,
      MeltyDAO: daoAddress,
    },
    parameters: {
      protocolFee: "5%",
      maxWonkaBars: 100,
      minWonkaBars: 5,
      maxBalance: "25%",
      chocoChipsPerEther: "1000",
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

  return true;
};

export default deployMeltyFi;

// Tags for selective deployment
deployMeltyFi.tags = ["MeltyFi", "all"];
deployMeltyFi.id = "deploy_meltyfi_protocol";
