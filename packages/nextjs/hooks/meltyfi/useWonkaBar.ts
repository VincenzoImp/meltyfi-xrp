import { useMemo } from "react";
import { useChainId, useReadContract } from "wagmi";
import { ABIS, getContractsByChainId } from "~~/lib/contracts";
import { ZERO_ADDRESS } from "~~/utils/scaffold-eth/common";

/**
 * Hook to fetch WonkaBar (lottery ticket) data
 */
export function useWonkaBar(userAddress?: `0x${string}`, lotteryId?: number) {
  const chainId = useChainId();
  const contracts = getContractsByChainId(chainId);
  const tokenAddress = contracts.WonkaBar;
  const enabled = useMemo(
    () => tokenAddress !== ZERO_ADDRESS && !!userAddress && lotteryId !== undefined,
    [tokenAddress, userAddress, lotteryId],
  );

  // Get user's WonkaBar balance for specific lottery
  const { data: balance, isLoading, error } = useReadContract({
    address: tokenAddress,
    abi: ABIS.WonkaBar,
    functionName: "balanceOf",
    args: userAddress && lotteryId !== undefined ? [userAddress, BigInt(lotteryId)] : undefined,
    query: {
      enabled,
      refetchInterval: 15_000, // Poll every 15 seconds
    },
  });

  return {
    balance: (balance as bigint) || 0n,
    isLoading,
    error: error || (enabled ? null : new Error("WonkaBar contract unavailable")),
  };
}

/**
 * Hook to fetch all WonkaBar balances for a user across all lotteries
 * TODO: Implement multicall for batch balance queries
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useWonkaBarBalances(_userAddress?: `0x${string}`, _lotteryIds?: number[]) {
  // This would require multiple calls or a multicall pattern
  // Placeholder implementation for now
  return {
    balances: {} as Record<number, bigint>,
    isLoading: false,
  };
}
