import { useChainId, useReadContract } from "wagmi";
import { ABIS, getContracts } from "~~/lib/contracts";

/**
 * Hook to fetch WonkaBar (lottery ticket) data
 */
export function useWonkaBar(userAddress?: `0x${string}`, lotteryId?: number) {
  const chainId = useChainId();
  const networkName = chainId === 31337 ? "localhost" : "sepolia";
  const contracts = getContracts(networkName);

  // Get user's WonkaBar balance for specific lottery
  const { data: balance, isLoading } = useReadContract({
    address: contracts.WonkaBar,
    abi: ABIS.WonkaBar,
    functionName: "balanceOf",
    args: userAddress && lotteryId !== undefined ? [userAddress, BigInt(lotteryId)] : undefined,
    query: {
      enabled: !!userAddress && lotteryId !== undefined,
      refetchInterval: 15_000, // Poll every 15 seconds
    },
  });

  return {
    balance: (balance as bigint) || 0n,
    isLoading,
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
