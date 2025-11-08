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
    ChocoChip: "0x2E2Ed0Cfd3AD2f1d34481277b3204d807Ca2F8c2" as Address,
    WonkaBar: "0xD8a5a9b31c3C0232E196d518E89Fd8bF83AcAd43" as Address,
    PseudoRandomGenerator: "0xDC11f7E700A4c898AE5CAddB1082cFfa76512aDD" as Address,
    MeltyTimelock: "0x51A1ceB83B83F1985a81C295d1fF28Afef186E02" as Address,
    MeltyFiProtocol: "0x36b58F5C1969B7b6591D752ea6F5486D069010AB" as Address,
    MeltyDAO: "0x8198f5d8F8CfFE8f9C413d98a0A55aEB8ab9FbB7" as Address,
    TestNFT: "0x0355B7B8cb128fA5692729Ab3AAa199C1753f726" as Address,
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
