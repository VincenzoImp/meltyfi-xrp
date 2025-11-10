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
 * 4. MeltyFiProtocol (main protocol)
 * 5. TestNFT (test collection)
 * 6. Setup roles and authorizations
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
  // Use local metadata server for localhost, production URL for all other networks
  const wonkaBarBaseURI =
    hre.network.name === "localhost" || hre.network.name === "hardhat"
      ? "http://localhost:3000/api/metadata/"
      : "https://meltyfi-xrp.vercel.app/api/metadata/";
  const wonkaBar = await upgrades.deployProxy(WonkaBar, [deployer, wonkaBarBaseURI], {
    initializer: "initialize",
    kind: "uups",
  });
  await wonkaBar.waitForDeployment();
  const wonkaBarAddress = await wonkaBar.getAddress();
  log(`✓ WonkaBar deployed to: ${wonkaBarAddress} with base URI: ${wonkaBarBaseURI}`);

  log("\n3. Deploying PseudoRandomGenerator (On-chain RNG)...");
  const PseudoRandomGenerator = await ethers.getContractFactory("PseudoRandomGenerator");
  const randomGenerator = await upgrades.deployProxy(PseudoRandomGenerator, [deployer, ethers.ZeroAddress], {
    initializer: "initialize",
    kind: "uups",
  });
  await randomGenerator.waitForDeployment();
  const randomGeneratorAddress = await randomGenerator.getAddress();
  log(`✓ PseudoRandomGenerator deployed to: ${randomGeneratorAddress}`);

  log("\n4. Deploying MeltyFiProtocol (Main Protocol)...");
  const MeltyFiProtocol = await ethers.getContractFactory("MeltyFiProtocol");
  const protocol = await upgrades.deployProxy(
    MeltyFiProtocol,
    [deployer, chocoChipAddress, wonkaBarAddress, randomGeneratorAddress, BAND_ORACLE_ADDRESS],
    {
      initializer: "initialize",
      kind: "uups",
    },
  );
  await protocol.waitForDeployment();
  const protocolAddress = await protocol.getAddress();
  log(`✓ MeltyFiProtocol deployed to: ${protocolAddress}`);

  log("\n5. Deploying Test NFT Collection (for testing/demo)...");
  const TestNFT = await ethers.getContractFactory("TestNFT");
  // Use local metadata server for localhost, production URL for all other networks
  const testNFTBaseURI =
    hre.network.name === "localhost" || hre.network.name === "hardhat"
      ? "http://localhost:3000/api/metadata/"
      : "https://meltyfi-xrp.vercel.app/api/metadata/";
  const testNFT = await TestNFT.deploy(
    "MeltyFi Test NFTs",
    "MELTY",
    testNFTBaseURI, // Base URI for metadata
  );
  await testNFT.waitForDeployment();
  const testNFTAddress = await testNFT.getAddress();
  log(`✓ TestNFT deployed to: ${testNFTAddress} with base URI: ${testNFTBaseURI}`);

  log("\n6. Setting up roles and authorizations...");

  // Authorize MeltyFiProtocol as ChocoChip minter
  log("   - Authorizing MeltyFiProtocol as ChocoChip minter...");
  await chocoChip.authorizeMinter(protocolAddress);

  // Set MeltyFiProtocol address in WonkaBar
  log("   - Setting MeltyFiProtocol in WonkaBar...");
  await wonkaBar.setMeltyFiProtocol(protocolAddress);

  // Update MeltyFiProtocol address in PseudoRandomGenerator
  log("   - Setting MeltyFiProtocol in PseudoRandomGenerator...");
  await randomGenerator.updateMeltyFiProtocol(protocolAddress);

  log("   ✓ Roles and authorizations configured successfully");

  log("\n========================================");
  log("MeltyFi Protocol Deployment Complete!");
  log("========================================");
  log("\nDeployed Contracts:");
  log(`  ChocoChip:              ${chocoChipAddress}`);
  log(`  WonkaBar:               ${wonkaBarAddress}`);
  log(`  PseudoRandomGenerator:  ${randomGeneratorAddress}`);
  log(`  MeltyFiProtocol:        ${protocolAddress}`);
  log(`  TestNFT:                ${testNFTAddress}`);
  log("\nNext Steps:");
  log("  1. Visit the Free Mint page to mint test NFTs");
  log("  2. Create lotteries with your minted NFTs");
  log("  3. Verify Band Protocol oracle address (currently: ${BAND_ORACLE_ADDRESS})");
  log("  4. Note: Using pseudo-random generation (not cryptographically secure)");
  log("  5. Protocol fees are stored in MeltyFiProtocol contract");
  log("========================================\n");

  const fs = await import("fs");
  const path = await import("path");

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
      MeltyFiProtocol: protocolAddress,
      TestNFT: testNFTAddress,
    },
    parameters: {
      protocolFee: "5%",
      maxWonkaBars: 100,
      minWonkaBars: 5,
      maxBalance: "25%",
      chocoChipsRewardPercentage: "10% of XRP USD value",
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments", hre.network.name);
  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(path.join(deploymentsDir, "meltyfi.json"), JSON.stringify(deploymentInfo, null, 2));

  // Auto-update frontend contracts map with latest addresses
  try {
    const prettier = await import("prettier");

    const contractsFilePath = path.join(__dirname, "..", "..", "nextjs", "lib", "contracts.ts");
    if (fs.existsSync(contractsFilePath)) {
      let contractsFileContent = fs.readFileSync(contractsFilePath, "utf8");

      const networkMapping: Record<string, string> = {
        localhost: "localhost",
        hardhat: "localhost",
        xrplEvmTestnet: "xrplEvmTestnet",
        xrplEvmMainnet: "xrplEvmMainnet",
      };

      const targetNetwork = networkMapping[hre.network.name] || "localhost";

      const newNetworkConfig = `const DYNAMIC_CONTRACTS: Partial<Record<SupportedNetwork, NetworkContracts>> = {
  ${targetNetwork}: {
    ChocoChip: "${chocoChipAddress}" as Address,
    WonkaBar: "${wonkaBarAddress}" as Address,
    PseudoRandomGenerator: "${randomGeneratorAddress}" as Address,
    MeltyFiProtocol: "${protocolAddress}" as Address,
    TestNFT: "${testNFTAddress}" as Address,
  },
};`;

      const dynamicRegex = /const DYNAMIC_CONTRACTS:[\s\S]*?};/m;
      if (dynamicRegex.test(contractsFileContent)) {
        contractsFileContent = contractsFileContent.replace(dynamicRegex, newNetworkConfig);
      } else {
        contractsFileContent = contractsFileContent.replace(
          "const ZERO_ADDRESS",
          `${newNetworkConfig}\n\nconst ZERO_ADDRESS`,
        );
      }

      const formatted = await prettier.format(contractsFileContent, { parser: "typescript" });
      fs.writeFileSync(contractsFilePath, formatted, "utf8");
      log(`\n✅ Updated frontend contracts map for ${targetNetwork}`);
    }
  } catch (error) {
    log(`\n⚠️  Failed to auto-update frontend contracts map: ${error}`);
  }

  // Generate deployedContracts.ts from deployment artifacts
  try {
    const prettier = await import("prettier");

    const networkChainIdMapping: Record<string, number> = {
      localhost: 31337,
      hardhat: 31337,
      xrplEvmTestnet: 1449000,
      xrplEvmMainnet: 1440000,
    };

    const deploymentsRoot = path.join(__dirname, "..", "deployments");
    const chainContracts: Record<number, Record<string, string>> = {};

    if (fs.existsSync(deploymentsRoot)) {
      const entries = fs.readdirSync(deploymentsRoot, { withFileTypes: true }).filter(entry => entry.isDirectory());
      for (const entry of entries) {
        const networkDir = entry.name;
        const chainId = networkChainIdMapping[networkDir];
        if (!chainId) continue;

        const deploymentFile = path.join(deploymentsRoot, networkDir, "meltyfi.json");
        if (!fs.existsSync(deploymentFile)) continue;

        try {
          const info = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
          const contracts = info.contracts;
          chainContracts[chainId] = {
            ChocoChip: contracts.ChocoChip,
            WonkaBar: contracts.WonkaBar,
            PseudoRandomGenerator: contracts.PseudoRandomGenerator,
            MeltyFiProtocol: contracts.MeltyFiProtocol,
            TestNFT: contracts.TestNFT,
          };
        } catch (jsonError) {
          log(`\n⚠️  Failed to parse deployment file for ${networkDir}: ${jsonError}`);
        }
      }
    }

    const deployedContractsFilePath = path.join(__dirname, "..", "..", "nextjs", "contracts", "deployedContracts.ts");

    const chainEntries = Object.entries(chainContracts)
      .map(
        ([chainId, contracts]) => `  ${chainId}: {
    ChocoChip: {
      address: "${contracts.ChocoChip}" as Address,
      abi: ChocoChipArtifact.abi,
    },
    WonkaBar: {
      address: "${contracts.WonkaBar}" as Address,
      abi: WonkaBarArtifact.abi,
    },
    PseudoRandomGenerator: {
      address: "${contracts.PseudoRandomGenerator}" as Address,
      abi: PseudoRandomGeneratorArtifact.abi,
    },
    MeltyFiProtocol: {
      address: "${contracts.MeltyFiProtocol}" as Address,
      abi: MeltyFiProtocolArtifact.abi,
    },
    TestNFT: {
      address: "${contracts.TestNFT}" as Address,
      abi: TestNFTArtifact.abi,
    },
  },`,
      )
      .join("\n");

    const headerComment = `/**
 * This file is autogenerated by the MeltyFi deployment script.
 * Do not edit manually.
 */`;

    const rawContent = `${headerComment}
import { type Address } from "viem";
import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";
import ChocoChipArtifact from "../hardhat/artifacts/contracts/ChocoChip.sol/ChocoChip.json";
import WonkaBarArtifact from "../hardhat/artifacts/contracts/WonkaBar.sol/WonkaBar.json";
import PseudoRandomGeneratorArtifact from "../hardhat/artifacts/contracts/PseudoRandomGenerator.sol/PseudoRandomGenerator.json";
import MeltyFiProtocolArtifact from "../hardhat/artifacts/contracts/MeltyFiProtocol.sol/MeltyFiProtocol.json";
import TestNFTArtifact from "../hardhat/artifacts/contracts/test/TestNFT.sol/TestNFT.json";

const deployedContracts = {
${chainEntries}
} as const satisfies GenericContractsDeclaration;

export default deployedContracts;
`;

    const formattedContent = await prettier.format(rawContent, { parser: "typescript" });
    fs.writeFileSync(deployedContractsFilePath, formattedContent, "utf8");
    log(`\n✅ Generated deployedContracts.ts with ${Object.keys(chainContracts).length} network entries`);
  } catch (error) {
    log(`\n⚠️  Failed to generate deployedContracts.ts: ${error}`);
  }

  return true;
};

export default deployMeltyFi;

// Tags for selective deployment
deployMeltyFi.tags = ["MeltyFi", "all"];
deployMeltyFi.id = "deploy_meltyfi_protocol";
