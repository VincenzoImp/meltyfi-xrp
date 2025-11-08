import { type Address } from "viem";

/**
 * Network-specific contract addresses
 */
export interface NetworkContracts {
  ChocoChip: Address;
  WonkaBar: Address;
  VRFManager: Address;
  MeltyTimelock: Address;
  MeltyFiProtocol: Address;
  MeltyDAO: Address;
}

/**
 * Supported networks
 */
export type SupportedNetwork = "localhost" | "sepolia" | "mainnet";

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
    chocoChipsPerEther: string;
    votingDelay: string;
    votingPeriod: string;
    proposalThreshold: string;
    quorum: string;
    timelockDelay: string;
  };
}
