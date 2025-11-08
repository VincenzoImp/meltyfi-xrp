import { useState } from "react";
import { useChainId, useWriteContract } from "wagmi";
import { useTransactor } from "~~/hooks/scaffold-eth";
import { ABIS, getContractsByChainId } from "~~/lib/contracts";

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

  const buyWonkaBars = async (lotteryId: number, amount: number, totalCost: bigint) => {
    try {
      setIsPending(true);
      setIsSuccess(false);

      await writeTx(
        () =>
          writeContractAsync({
            address: contracts.MeltyFiProtocol,
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
    } finally {
      setIsPending(false);
    }
  };

  return {
    buyWonkaBars,
    isPending,
    isSuccess,
  };
}
