// Import ABIs from contract artifacts
import ChocoChipArtifact from "../../hardhat/artifacts/contracts/ChocoChip.sol/ChocoChip.json";
import MeltyDAOArtifact from "../../hardhat/artifacts/contracts/MeltyDAO.sol/MeltyDAO.json";
import MeltyFiProtocolArtifact from "../../hardhat/artifacts/contracts/MeltyFiProtocol.sol/MeltyFiProtocol.json";
import MeltyTimelockArtifact from "../../hardhat/artifacts/contracts/MeltyTimelock.sol/MeltyTimelock.json";
import VRFManagerArtifact from "../../hardhat/artifacts/contracts/VRFManager.sol/VRFManager.json";
import WonkaBarArtifact from "../../hardhat/artifacts/contracts/WonkaBar.sol/WonkaBar.json";
import { type Address } from "viem";
import type { NetworkContracts } from "~~/types/contracts";

/**
 * Contract addresses by network
 */
export const CONTRACTS: Record<string, NetworkContracts> = {
  localhost: {
    ChocoChip: "0x21dF544947ba3E8b3c32561399E88B52Dc8b2823" as Address,
    WonkaBar: "0x2E2Ed0Cfd3AD2f1d34481277b3204d807Ca2F8c2" as Address,
    VRFManager: "0xD8a5a9b31c3C0232E196d518E89Fd8bF83AcAd43" as Address,
    MeltyTimelock: "0xDC11f7E700A4c898AE5CAddB1082cFfa76512aDD" as Address,
    MeltyFiProtocol: "0x51A1ceB83B83F1985a81C295d1fF28Afef186E02" as Address,
    MeltyDAO: "0x36b58F5C1969B7b6591D752ea6F5486D069010AB" as Address,
  },
  // Add addresses for other networks when deployed
  sepolia: {
    ChocoChip: "0x0000000000000000000000000000000000000000" as Address,
    WonkaBar: "0x0000000000000000000000000000000000000000" as Address,
    VRFManager: "0x0000000000000000000000000000000000000000" as Address,
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
  VRFManager: VRFManagerArtifact.abi,
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
