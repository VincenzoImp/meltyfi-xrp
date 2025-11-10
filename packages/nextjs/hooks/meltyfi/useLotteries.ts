import { useMemo } from "react";
import { useChainId, useReadContract } from "wagmi";
import { LotteryState } from "~~/lib/constants";
import { ABIS, getContractsByChainId } from "~~/lib/contracts";
import { ZERO_ADDRESS } from "~~/utils/scaffold-eth/common";
import type { Lottery } from "~~/types/lottery";

/**
 * Hook to fetch all active lotteries
 */
export function useLotteries() {
  const chainId = useChainId();
  const contracts = getContractsByChainId(chainId);
  const protocolAddress = contracts.MeltyFiProtocol;
  const enabled = useMemo(() => protocolAddress !== ZERO_ADDRESS, [protocolAddress]);

  // Get active lottery IDs
  const {
    data: activeLotteryIds,
    isLoading: isLoadingIds,
    error: activeIdsError,
  } = useReadContract({
    address: protocolAddress,
    abi: ABIS.MeltyFiProtocol,
    functionName: "getActiveLotteries",
    query: {
      refetchInterval: 15_000, // Poll every 15 seconds
      enabled,
    },
  });

  // Get protocol stats
  const { data: stats, error: statsError } = useReadContract({
    address: protocolAddress,
    abi: ABIS.MeltyFiProtocol,
    functionName: "getProtocolStats",
    query: {
      enabled,
    },
  });

  // TODO: Fetch individual lottery details for each ID
  // This would require multiple contract calls or a multicall pattern
  // For now, returning the IDs

  return {
    lotteryIds: (activeLotteryIds as bigint[]) || [],
    totalLotteries: stats ? Number((stats as any[])[0]) : 0,
    activeLotteries: stats ? Number((stats as any[])[1]) : 0,
    isLoading: isLoadingIds,
    error: activeIdsError || statsError || (enabled ? null : new Error("MeltyFiProtocol contract unavailable")),
  };
}

/**
 * Hook to fetch a single lottery by ID
 */
export function useLottery(lotteryId: number) {
  const chainId = useChainId();
  const contracts = getContractsByChainId(chainId);
  const protocolAddress = contracts.MeltyFiProtocol;
  const enabled = useMemo(() => protocolAddress !== ZERO_ADDRESS && lotteryId >= 0, [protocolAddress, lotteryId]);

  const { data, isLoading, error, refetch } = useReadContract({
    address: protocolAddress,
    abi: ABIS.MeltyFiProtocol,
    functionName: "getLottery",
    args: [BigInt(lotteryId)],
    query: {
      refetchInterval: 10_000, // Poll every 10 seconds
      enabled,
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
    error: error || (enabled ? null : new Error("MeltyFiProtocol contract unavailable")),
    refetch,
  };
}

/**
 * Hook to fetch user's created lotteries
 */
export function useUserLotteries(userAddress?: `0x${string}`) {
  const chainId = useChainId();
  const contracts = getContractsByChainId(chainId);
  const protocolAddress = contracts.MeltyFiProtocol;
  const enabled = useMemo(
    () => protocolAddress !== ZERO_ADDRESS && !!userAddress,
    [protocolAddress, userAddress],
  );

  const {
    data: lotteryIds,
    isLoading,
    error,
  } = useReadContract({
    address: protocolAddress,
    abi: ABIS.MeltyFiProtocol,
    functionName: "getUserLotteries",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled,
    },
  });

  return {
    lotteryIds: (lotteryIds as bigint[]) || [],
    isLoading,
    error: error || (enabled || !userAddress ? null : new Error("MeltyFiProtocol contract unavailable")),
  };
}

/**
 * Hook to fetch user's participated lotteries
 */
export function useUserParticipations(userAddress?: `0x${string}`) {
  const chainId = useChainId();
  const contracts = getContractsByChainId(chainId);
  const protocolAddress = contracts.MeltyFiProtocol;
  const enabled = useMemo(
    () => protocolAddress !== ZERO_ADDRESS && !!userAddress,
    [protocolAddress, userAddress],
  );

  const {
    data: lotteryIds,
    isLoading,
    error,
  } = useReadContract({
    address: protocolAddress,
    abi: ABIS.MeltyFiProtocol,
    functionName: "getUserParticipations",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled,
    },
  });

  return {
    lotteryIds: (lotteryIds as bigint[]) || [],
    isLoading,
    error: error || (enabled || !userAddress ? null : new Error("MeltyFiProtocol contract unavailable")),
  };
}

/**
 * Hook to calculate win probability for a user in a lottery
 */
export function useWinProbability(userAddress?: `0x${string}`, lotteryId?: number) {
  const chainId = useChainId();
  const contracts = getContractsByChainId(chainId);
  const protocolAddress = contracts.MeltyFiProtocol;
  const enabled = useMemo(
    () => protocolAddress !== ZERO_ADDRESS && !!userAddress && lotteryId !== undefined,
    [protocolAddress, userAddress, lotteryId],
  );

  const { data: probability, error } = useReadContract({
    address: protocolAddress,
    abi: ABIS.MeltyFiProtocol,
    functionName: "calculateWinProbability",
    args: userAddress && lotteryId !== undefined ? [userAddress, BigInt(lotteryId)] : undefined,
    query: {
      enabled,
    },
  });

  return {
    probability: probability ? Number(probability) / 100 : 0, // Convert from basis points to percentage
    error: error || (enabled ? null : new Error("MeltyFiProtocol contract unavailable")),
  };
}
