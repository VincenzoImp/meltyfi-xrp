// Import ABIs from contract artifacts
import ChocoChipArtifact from "../../hardhat/artifacts/contracts/ChocoChip.sol/ChocoChip.json";
import MeltyDAOArtifact from "../../hardhat/artifacts/contracts/MeltyDAO.sol/MeltyDAO.json";
import MeltyFiProtocolArtifact from "../../hardhat/artifacts/contracts/MeltyFiProtocol.sol/MeltyFiProtocol.json";
import MeltyTimelockArtifact from "../../hardhat/artifacts/contracts/MeltyTimelock.sol/MeltyTimelock.json";
import PseudoRandomGeneratorArtifact from "../../hardhat/artifacts/contracts/PseudoRandomGenerator.sol/PseudoRandomGenerator.json";
import WonkaBarArtifact from "../../hardhat/artifacts/contracts/WonkaBar.sol/WonkaBar.json";
import TestNFTArtifact from "../../hardhat/artifacts/contracts/test/TestNFT.sol/TestNFT.json";
import { type Address } from "viem";
import type { NetworkContracts } from "~~/types/contracts";

/**
 * Contract addresses by network
 */
export const CONTRACTS: Record<string, NetworkContracts> = {
  localhost: {
    ChocoChip: "0x95401dc811bb5740090279Ba06cfA8fcF6113778" as Address,
    WonkaBar: "0x998abeb3E57409262aE5b751f60747921B33613E" as Address,
    PseudoRandomGenerator: "0x70e0bA845a1A0F2DA3359C97E0285013525FFC49" as Address,
    MeltyTimelock: "0x4826533B4897376654Bb4d4AD88B7faFD0C98528" as Address,
    MeltyFiProtocol: "0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf" as Address,
    MeltyDAO: "0x0E801D84Fa97b50751Dbf25036d067dCf18858bF" as Address,
    TestNFT: "0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf" as Address,
  },
  // Add addresses for XRP EVM networks when deployed
  xrplEvmTestnet: {
    ChocoChip: "0x0000000000000000000000000000000000000000" as Address,
    WonkaBar: "0x0000000000000000000000000000000000000000" as Address,
    PseudoRandomGenerator: "0x0000000000000000000000000000000000000000" as Address,
    MeltyTimelock: "0x0000000000000000000000000000000000000000" as Address,
    MeltyFiProtocol: "0x0000000000000000000000000000000000000000" as Address,
    MeltyDAO: "0x0000000000000000000000000000000000000000" as Address,
    TestNFT: "0x0000000000000000000000000000000000000000" as Address,
  },
} as const;

/**
 * Contract ABIs
 */
export const ABIS = {
  ChocoChip: ChocoChipArtifact.abi,
  WonkaBar: WonkaBarArtifact.abi,
  PseudoRandomGenerator: PseudoRandomGeneratorArtifact.abi,
  MeltyTimelock: MeltyTimelockArtifact.abi,
  MeltyFiProtocol: MeltyFiProtocolArtifact.abi,
  MeltyDAO: MeltyDAOArtifact.abi,
  TestNFT: TestNFTArtifact.abi,
} as const;

/**
 * Get network name from chain ID
 */
export function getNetworkName(chainId: number): string {
  if (chainId === 31337) return "localhost";
  if (chainId === 1440002) return "xrplEvmTestnet"; // XRP EVM Testnet
  if (chainId === 1440000) return "xrplEvmTestnet"; // XRP EVM Mainnet (using testnet config for now)
  // Default to localhost for unknown networks
  return "localhost";
}

/**
 * Get contract addresses for current network by chain ID
 */
export function getContractsByChainId(chainId: number): NetworkContracts {
  const networkName = getNetworkName(chainId);
  return CONTRACTS[networkName] || CONTRACTS.localhost;
}

/**
 * Get contract addresses for current network (legacy - use getContractsByChainId)
 */
export function getContracts(networkName: string): NetworkContracts {
  return CONTRACTS[networkName] || CONTRACTS.localhost;
}

/**
 * Get specific contract address
 */
export function getContractAddress(networkName: string, contractName: keyof NetworkContracts): Address {
  const contracts = getContracts(networkName);
  return contracts[contractName];
}
