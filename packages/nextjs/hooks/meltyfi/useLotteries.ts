import { useChainId, useReadContract } from "wagmi";
import { LotteryState } from "~~/lib/constants";
import { ABIS, getContracts } from "~~/lib/contracts";
import type { Lottery } from "~~/types/lottery";

/**
 * Hook to fetch all active lotteries
 */
export function useLotteries() {
  const chainId = useChainId();
  const networkName = chainId === 31337 ? "localhost" : "sepolia";
  const contracts = getContracts(networkName);

  // Get active lottery IDs
  const { data: activeLotteryIds, isLoading: isLoadingIds } = useReadContract({
    address: contracts.MeltyFiProtocol,
    abi: ABIS.MeltyFiProtocol,
    functionName: "getActiveLotteries",
    query: {
      refetchInterval: 15_000, // Poll every 15 seconds
    },
  });

  // Get protocol stats
  const { data: stats } = useReadContract({
    address: contracts.MeltyFiProtocol,
    abi: ABIS.MeltyFiProtocol,
    functionName: "getProtocolStats",
  });

  // TODO: Fetch individual lottery details for each ID
  // This would require multiple contract calls or a multicall pattern
  // For now, returning the IDs

  return {
    lotteryIds: (activeLotteryIds as bigint[]) || [],
    totalLotteries: stats ? Number((stats as any[])[0]) : 0,
    activeLotteries: stats ? Number((stats as any[])[1]) : 0,
    isLoading: isLoadingIds,
  };
}

/**
 * Hook to fetch a single lottery by ID
 */
export function useLottery(lotteryId: number) {
  const chainId = useChainId();
  const networkName = chainId === 31337 ? "localhost" : "sepolia";
  const contracts = getContracts(networkName);

  const { data, isLoading, error, refetch } = useReadContract({
    address: contracts.MeltyFiProtocol,
    abi: ABIS.MeltyFiProtocol,
    functionName: "getLottery",
    args: [BigInt(lotteryId)],
    query: {
      refetchInterval: 10_000, // Poll every 10 seconds
    },
  });

  // Transform contract data to Lottery type
  const lottery: Lottery | null = data
    ? {
        id: lotteryId,
        owner: (data as any).owner,
        nftContract: (data as any).nftContract,
        nftTokenId: (data as any).nftTokenId,
        nftName: (data as any).nftName,
        nftImageUrl: (data as any).nftImageUrl,
        wonkaBarPrice: (data as any).wonkaBarPrice,
        wonkaBarsMaxSupply: Number((data as any).wonkaBarsMaxSupply),
        wonkaBarsSold: Number((data as any).wonkaBarsSold),
        totalRaised: (data as any).totalRaised,
        state: Number((data as any).state) as LotteryState,
        expirationDate: new Date(Number((data as any).expirationDate) * 1000),
        winner:
          (data as any).winner !== "0x0000000000000000000000000000000000000000" ? (data as any).winner : undefined,
      }
    : null;

  return {
    lottery,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch user's created lotteries
 */
export function useUserLotteries(userAddress?: `0x${string}`) {
  const chainId = useChainId();
  const networkName = chainId === 31337 ? "localhost" : "sepolia";
  const contracts = getContracts(networkName);

  const { data: lotteryIds, isLoading } = useReadContract({
    address: contracts.MeltyFiProtocol,
    abi: ABIS.MeltyFiProtocol,
    functionName: "getUserLotteries",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    lotteryIds: (lotteryIds as bigint[]) || [],
    isLoading,
  };
}

/**
 * Hook to fetch user's participated lotteries
 */
export function useUserParticipations(userAddress?: `0x${string}`) {
  const chainId = useChainId();
  const networkName = chainId === 31337 ? "localhost" : "sepolia";
  const contracts = getContracts(networkName);

  const { data: lotteryIds, isLoading } = useReadContract({
    address: contracts.MeltyFiProtocol,
    abi: ABIS.MeltyFiProtocol,
    functionName: "getUserParticipations",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    lotteryIds: (lotteryIds as bigint[]) || [],
    isLoading,
  };
}

/**
 * Hook to calculate win probability for a user in a lottery
 */
export function useWinProbability(userAddress?: `0x${string}`, lotteryId?: number) {
  const chainId = useChainId();
  const networkName = chainId === 31337 ? "localhost" : "sepolia";
  const contracts = getContracts(networkName);

  const { data: probability } = useReadContract({
    address: contracts.MeltyFiProtocol,
    abi: ABIS.MeltyFiProtocol,
    functionName: "calculateWinProbability",
    args: userAddress && lotteryId !== undefined ? [userAddress, BigInt(lotteryId)] : undefined,
    query: {
      enabled: !!userAddress && lotteryId !== undefined,
    },
  });

  return {
    probability: probability ? Number(probability) / 100 : 0, // Convert from basis points to percentage
  };
}
