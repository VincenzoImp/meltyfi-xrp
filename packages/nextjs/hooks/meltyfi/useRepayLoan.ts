import { useMemo, useState } from "react";
import { useChainId, useWriteContract } from "wagmi";
import { useTransactor } from "~~/hooks/scaffold-eth";
import { ABIS, getContractsByChainId } from "~~/lib/contracts";
import { ZERO_ADDRESS } from "~~/utils/scaffold-eth/common";

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
  const [error, setError] = useState<Error | null>(null);
  const protocolAddress = contracts.MeltyFiProtocol;
  const canTransact = useMemo(() => protocolAddress !== ZERO_ADDRESS, [protocolAddress]);

  const repayLoan = async (lotteryId: number, repaymentAmount: bigint) => {
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
      setError(error instanceof Error ? error : new Error("Failed to repay loan"));
    } finally {
      setIsPending(false);
    }
  };

  return {
    repayLoan,
    isPending,
    isSuccess,
    error,
    canTransact,
  };
}
