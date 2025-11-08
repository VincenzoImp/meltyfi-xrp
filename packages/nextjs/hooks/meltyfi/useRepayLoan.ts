import { useState } from "react";
import { useChainId, useWriteContract } from "wagmi";
import { useTransactor } from "~~/hooks/scaffold-eth";
import { ABIS, getContractsByChainId } from "~~/lib/contracts";

/**
 * Hook to repay a loan and retrieve NFT
 */
export function useRepayLoan() {
  const chainId = useChainId();
  const contracts = getContractsByChainId(chainId);
  const writeTx = useTransactor();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const repayLoan = async (lotteryId: number, repaymentAmount: bigint) => {
    try {
      setIsPending(true);
      setIsSuccess(false);

      await writeTx(
        () =>
          writeContractAsync({
            address: contracts.MeltyFiProtocol,
            abi: ABIS.MeltyFiProtocol,
            functionName: "repayLoan",
            args: [BigInt(lotteryId)],
            value: repaymentAmount,
          }),
        { blockConfirmations: 1 },
      );

      setIsSuccess(true);
    } catch (error) {
      console.error("Repay loan error:", error);
      setIsSuccess(false);
    } finally {
      setIsPending(false);
    }
  };

  return {
    repayLoan,
    isPending,
    isSuccess,
  };
}
