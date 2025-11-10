import { useMemo, useState } from "react";
import { useChainId, useWriteContract } from "wagmi";
import { useTransactor } from "~~/hooks/scaffold-eth";
import { ABIS, getContractsByChainId } from "~~/lib/contracts";
import { ZERO_ADDRESS } from "~~/utils/scaffold-eth/common";

/**
 * Hook to buy WonkaBars in a lottery
 */
export function useBuyWonkaBars() {
  const chainId = useChainId();
  const contracts = getContractsByChainId(chainId);
  const writeTx = useTransactor();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const protocolAddress = contracts.MeltyFiProtocol;
  const canTransact = useMemo(() => protocolAddress !== ZERO_ADDRESS, [protocolAddress]);

  const buyWonkaBars = async (lotteryId: number, amount: number, totalCost: bigint) => {
    try {
      if (!canTransact) {
        throw new Error("MeltyFiProtocol contract not available on this network");
      }

      setIsPending(true);
      setIsSuccess(false);
      setError(null);

      await writeTx(
        () =>
          writeContractAsync({
            address: protocolAddress,
            abi: ABIS.MeltyFiProtocol,
            functionName: "buyWonkaBars",
            args: [BigInt(lotteryId), BigInt(amount)],
            value: totalCost,
          }),
        { blockConfirmations: 1 },
      );

      setIsSuccess(true);
    } catch (error) {
      console.error("Buy WonkaBars error:", error);
      setIsSuccess(false);
      setError(error instanceof Error ? error : new Error("Failed to buy WonkaBars"));
    } finally {
      setIsPending(false);
    }
  };

  return {
    buyWonkaBars,
    isPending,
    isSuccess,
    error,
    canTransact,
  };
}
