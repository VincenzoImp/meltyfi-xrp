import { type Address } from "viem";

/**
 * Network-specific contract addresses
 */
export interface NetworkContracts {
  ChocoChip: Address;
  WonkaBar: Address;
  PseudoRandomGenerator: Address;
  MeltyFiProtocol: Address;
  TestNFT: Address;
}

/**
 * Supported networks
 */
export type SupportedNetwork = "localhost" | "xrplEvmTestnet" | "xrplEvmMainnet";

/**
 * Contract deployment info
 */
export interface DeploymentInfo {
  network: string;
  timestamp: string;
  contracts: NetworkContracts;
  parameters: {
    protocolFee: string;
    maxWonkaBars: number;
    minWonkaBars: number;
    maxBalance: string;
    chocoChipsRewardPercentage: string;
  };
}
