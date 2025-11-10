import { useMemo } from "react";
import { useChainId, useReadContract } from "wagmi";
import { ABIS, getContractsByChainId } from "~~/lib/contracts";
import { ZERO_ADDRESS } from "~~/utils/scaffold-eth/common";

/**
 * Hook to fetch ChocoChip token data
 */
export function useChocoChip(userAddress?: `0x${string}`) {
  const chainId = useChainId();
  const contracts = getContractsByChainId(chainId);
  const tokenAddress = contracts.ChocoChip;
  const enabled = useMemo(() => tokenAddress !== ZERO_ADDRESS, [tokenAddress]);

  // Get user's ChocoChip balance
  const {
    data: balance,
    isLoading: isLoadingBalance,
    error: balanceError,
  } = useReadContract({
    address: tokenAddress,
    abi: ABIS.ChocoChip,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: enabled && !!userAddress,
      refetchInterval: 30_000, // Poll every 30 seconds
    },
  });

  // Get total supply
  const { data: totalSupply, error: totalSupplyError } = useReadContract({
    address: tokenAddress,
    abi: ABIS.ChocoChip,
    functionName: "totalSupply",
    query: {
      enabled,
    },
  });

  // Get max supply
  const { data: maxSupply, error: maxSupplyError } = useReadContract({
    address: tokenAddress,
    abi: ABIS.ChocoChip,
    functionName: "MAX_SUPPLY",
    query: {
      enabled,
    },
  });

  // Get voting power
  const { data: votes, error: votesError } = useReadContract({
    address: tokenAddress,
    abi: ABIS.ChocoChip,
    functionName: "getVotes",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: enabled && !!userAddress,
    },
  });

  return {
    balance: (balance as bigint) || 0n,
    totalSupply: (totalSupply as bigint) || 0n,
    maxSupply: (maxSupply as bigint) || 0n,
    votes: (votes as bigint) || 0n,
    isLoading: isLoadingBalance,
    error:
      balanceError ||
      totalSupplyError ||
      maxSupplyError ||
      votesError ||
      (enabled ? null : new Error("ChocoChip contract unavailable")),
  };
}
