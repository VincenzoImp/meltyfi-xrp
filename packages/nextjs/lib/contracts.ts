import ChocoChipArtifact from "../../hardhat/artifacts/contracts/ChocoChip.sol/ChocoChip.json";
import MeltyFiProtocolArtifact from "../../hardhat/artifacts/contracts/MeltyFiProtocol.sol/MeltyFiProtocol.json";
import PseudoRandomGeneratorArtifact from "../../hardhat/artifacts/contracts/PseudoRandomGenerator.sol/PseudoRandomGenerator.json";
import WonkaBarArtifact from "../../hardhat/artifacts/contracts/WonkaBar.sol/WonkaBar.json";
import TestNFTArtifact from "../../hardhat/artifacts/contracts/test/TestNFT.sol/TestNFT.json";
import type { Address } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";
import type { NetworkContracts, SupportedNetwork } from "~~/types/contracts";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const EMPTY_CONTRACTS: NetworkContracts = {
  ChocoChip: ZERO_ADDRESS,
  WonkaBar: ZERO_ADDRESS,
  PseudoRandomGenerator: ZERO_ADDRESS,
  MeltyFiProtocol: ZERO_ADDRESS,
  TestNFT: ZERO_ADDRESS,
};

const DYNAMIC_CONTRACTS: Partial<Record<SupportedNetwork, NetworkContracts>> = {
  xrplEvmTestnet: {
    ChocoChip: "0x573424b2bA2C6Bf5C632F3997a10Ae7C2A66FA85" as Address,
    WonkaBar: "0x08ff157C7b181B5317c2e73087E231b0Cd38F6f3" as Address,
    PseudoRandomGenerator: "0x90104dEd31fcef5246746aEe22815e91c8Ed6a4b" as Address,
    MeltyFiProtocol: "0x8895754F73221489181b082f4360808c89841A45" as Address,
    TestNFT: "0xF316Eba4D67325DF9Fb242874B04c3Efe0cC402e" as Address,
  },
};

const NETWORK_NAME_BY_CHAIN_ID: Record<number, SupportedNetwork> = {
  31337: "localhost",
  1440000: "xrplEvmMainnet",
  1449000: "xrplEvmTestnet",
};

const CHAIN_ID_BY_NETWORK_NAME: Record<SupportedNetwork, number> = {
  localhost: 31337,
  xrplEvmMainnet: 1440000,
  xrplEvmTestnet: 1449000,
};

type DeployedContracts = Record<number, Record<string, { address?: string }>>;

const deployedContractsMap = deployedContracts as unknown as DeployedContracts;

function toNetworkContracts(contracts?: Record<string, { address?: string }>): NetworkContracts {
  if (!contracts) return EMPTY_CONTRACTS;

  return {
    ChocoChip: (contracts.ChocoChip?.address ?? ZERO_ADDRESS) as Address,
    WonkaBar: (contracts.WonkaBar?.address ?? ZERO_ADDRESS) as Address,
    PseudoRandomGenerator: (contracts.PseudoRandomGenerator?.address ?? ZERO_ADDRESS) as Address,
    MeltyFiProtocol: (contracts.MeltyFiProtocol?.address ?? ZERO_ADDRESS) as Address,
    TestNFT: (contracts.TestNFT?.address ?? ZERO_ADDRESS) as Address,
  };
}

/**
 * Contract ABIs
 */
export const ABIS = {
  ChocoChip: ChocoChipArtifact.abi,
  WonkaBar: WonkaBarArtifact.abi,
  PseudoRandomGenerator: PseudoRandomGeneratorArtifact.abi,
  MeltyFiProtocol: MeltyFiProtocolArtifact.abi,
  TestNFT: TestNFTArtifact.abi,
} as const;

/**
 * Get network name from chain ID
 */
export function getNetworkName(chainId: number): SupportedNetwork {
  return NETWORK_NAME_BY_CHAIN_ID[chainId] ?? "localhost";
}

/**
 * Get contract addresses for current network by chain ID
 */
export function getContractsByChainId(chainId: number): NetworkContracts {
  const chainContracts = deployedContractsMap?.[chainId];
  if (chainContracts) {
    return toNetworkContracts(chainContracts);
  }

  const networkName = getNetworkName(chainId);
  const dynamicContracts = DYNAMIC_CONTRACTS[networkName];

  return dynamicContracts ?? EMPTY_CONTRACTS;
}

/**
 * Get contract addresses for current network (legacy - use getContractsByChainId)
 */
export function getContracts(networkName: SupportedNetwork): NetworkContracts {
  const chainId = CHAIN_ID_BY_NETWORK_NAME[networkName] ?? 31337;

  return getContractsByChainId(chainId);
}

/**
 * Get specific contract address
 */
export function getContractAddress(networkName: SupportedNetwork, contractName: keyof NetworkContracts): Address {
  const contracts = getContracts(networkName);

  return contracts[contractName];
}
