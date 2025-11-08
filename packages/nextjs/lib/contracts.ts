// Import ABIs from contract artifacts
import ChocoChipArtifact from "../../hardhat/artifacts/contracts/ChocoChip.sol/ChocoChip.json";
import MeltyDAOArtifact from "../../hardhat/artifacts/contracts/MeltyDAO.sol/MeltyDAO.json";
import MeltyFiProtocolArtifact from "../../hardhat/artifacts/contracts/MeltyFiProtocol.sol/MeltyFiProtocol.json";
import MeltyTimelockArtifact from "../../hardhat/artifacts/contracts/MeltyTimelock.sol/MeltyTimelock.json";
import PseudoRandomGeneratorArtifact from "../../hardhat/artifacts/contracts/PseudoRandomGenerator.sol/PseudoRandomGenerator.json";
import WonkaBarArtifact from "../../hardhat/artifacts/contracts/WonkaBar.sol/WonkaBar.json";
import { type Address } from "viem";
import type { NetworkContracts } from "~~/types/contracts";

/**
 * Contract addresses by network
 */
export const CONTRACTS: Record<string, NetworkContracts> = {
  localhost: {
    ChocoChip: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9" as Address,
    WonkaBar: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707" as Address,
    PseudoRandomGenerator: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853" as Address,
    MeltyTimelock: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318" as Address,
    MeltyFiProtocol: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e" as Address,
    MeltyDAO: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82" as Address,
  },
  // Add addresses for XRP EVM networks when deployed
  xrplEvmTestnet: {
    ChocoChip: "0x0000000000000000000000000000000000000000" as Address,
    WonkaBar: "0x0000000000000000000000000000000000000000" as Address,
    PseudoRandomGenerator: "0x0000000000000000000000000000000000000000" as Address,
    MeltyTimelock: "0x0000000000000000000000000000000000000000" as Address,
    MeltyFiProtocol: "0x0000000000000000000000000000000000000000" as Address,
    MeltyDAO: "0x0000000000000000000000000000000000000000" as Address,
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
} as const;

/**
 * Get contract addresses for current network
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
