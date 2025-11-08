import { useChainId, useReadContract } from "wagmi";
import { ABIS, getContracts } from "~~/lib/contracts";

/**
 * Hook to fetch ChocoChip token data
 */
export function useChocoChip(userAddress?: `0x${string}`) {
  const chainId = useChainId();
  const networkName = chainId === 31337 ? "localhost" : "sepolia";
  const contracts = getContracts(networkName);

  // Get user's ChocoChip balance
  const { data: balance, isLoading: isLoadingBalance } = useReadContract({
    address: contracts.ChocoChip,
    abi: ABIS.ChocoChip,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
      refetchInterval: 30_000, // Poll every 30 seconds
    },
  });

  // Get total supply
  const { data: totalSupply } = useReadContract({
    address: contracts.ChocoChip,
    abi: ABIS.ChocoChip,
    functionName: "totalSupply",
  });

  // Get max supply
  const { data: maxSupply } = useReadContract({
    address: contracts.ChocoChip,
    abi: ABIS.ChocoChip,
    functionName: "MAX_SUPPLY",
  });

  // Get voting power
  const { data: votes } = useReadContract({
    address: contracts.ChocoChip,
    abi: ABIS.ChocoChip,
    functionName: "getVotes",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    balance: (balance as bigint) || 0n,
    totalSupply: (totalSupply as bigint) || 0n,
    maxSupply: (maxSupply as bigint) || 0n,
    votes: (votes as bigint) || 0n,
    isLoading: isLoadingBalance,
  };
}
