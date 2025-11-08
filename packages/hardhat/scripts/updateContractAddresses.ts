import * as fs from "fs";
import * as path from "path";

/**
 * Updates the contract addresses in packages/nextjs/lib/contracts.ts
 * This script reads from the deployment JSON files and updates the TypeScript file
 */
async function updateContractAddresses() {
  const networkName = process.env.HARDHAT_NETWORK || "localhost";

  // Path to deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", networkName, "meltyfi.json");

  if (!fs.existsSync(deploymentPath)) {
    console.log(`⚠️  No deployment found for network: ${networkName}`);
    console.log(`   Looking for: ${deploymentPath}`);
    return;
  }

  // Read deployment info
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contracts = deploymentInfo.contracts;

  // Path to contracts.ts file
  const contractsFilePath = path.join(__dirname, "..", "..", "nextjs", "lib", "contracts.ts");

  if (!fs.existsSync(contractsFilePath)) {
    console.log(`⚠️  contracts.ts file not found at: ${contractsFilePath}`);
    return;
  }

  // Read the current contracts.ts file
  let contractsFileContent = fs.readFileSync(contractsFilePath, "utf8");

  // Map network names (deployment script uses different names than config)
  const networkMapping: Record<string, string> = {
    localhost: "localhost",
    hardhat: "localhost",
    xrplEvmTestnet: "xrplEvmTestnet",
    xrplEvmMainnet: "xrplEvmMainnet",
  };

  const targetNetwork = networkMapping[networkName] || "localhost";

  // Build the new network configuration
  const newNetworkConfig = `  ${targetNetwork}: {
    ChocoChip: "${contracts.ChocoChip}" as Address,
    WonkaBar: "${contracts.WonkaBar}" as Address,
    PseudoRandomGenerator: "${contracts.PseudoRandomGenerator}" as Address,
    MeltyTimelock: "${contracts.MeltyTimelock}" as Address,
    MeltyFiProtocol: "${contracts.MeltyFiProtocol}" as Address,
    MeltyDAO: "${contracts.MeltyDAO}" as Address,
    TestNFT: "${contracts.TestNFT}" as Address,
  },`;

  // Use regex to replace the network configuration
  const networkPattern = new RegExp(
    `  ${targetNetwork}:\\s*{[^}]*ChocoChip:[^}]*WonkaBar:[^}]*PseudoRandomGenerator:[^}]*MeltyTimelock:[^}]*MeltyFiProtocol:[^}]*MeltyDAO:[^}]*TestNFT:[^}]*},`,
    "s",
  );

  if (networkPattern.test(contractsFileContent)) {
    contractsFileContent = contractsFileContent.replace(networkPattern, newNetworkConfig);

    // Write the updated file
    fs.writeFileSync(contractsFilePath, contractsFileContent, "utf8");

    console.log(`✅ Updated contract addresses for network: ${targetNetwork}`);
    console.log(`   ChocoChip:              ${contracts.ChocoChip}`);
    console.log(`   WonkaBar:               ${contracts.WonkaBar}`);
    console.log(`   PseudoRandomGenerator:  ${contracts.PseudoRandomGenerator}`);
    console.log(`   MeltyTimelock:          ${contracts.MeltyTimelock}`);
    console.log(`   MeltyFiProtocol:        ${contracts.MeltyFiProtocol}`);
    console.log(`   MeltyDAO:               ${contracts.MeltyDAO}`);
    console.log(`   TestNFT:                ${contracts.TestNFT}`);
  } else {
    console.log(`⚠️  Could not find network configuration for: ${targetNetwork}`);
    console.log(`   The contracts.ts file may need to be updated manually.`);
  }
}

updateContractAddresses()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
