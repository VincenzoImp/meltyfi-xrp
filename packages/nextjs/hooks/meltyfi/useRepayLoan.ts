import { toast } from "sonner";
import { useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "~~/lib/constants";
import { ABIS, getContracts } from "~~/lib/contracts";

/**
 * Hook to repay a loan and retrieve NFT
 */
export function useRepayLoan() {
  const chainId = useChainId();
  const networkName = chainId === 31337 ? "localhost" : "sepolia";
  const contracts = getContracts(networkName);

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const repayLoan = async (lotteryId: number, repaymentAmount: bigint) => {
    try {
      writeContract(
        {
          address: contracts.MeltyFiProtocol,
          abi: ABIS.MeltyFiProtocol,
          functionName: "repayLoan",
          args: [BigInt(lotteryId)],
          value: repaymentAmount,
        },
        {
          onSuccess: () => {
            toast.success(SUCCESS_MESSAGES.LOAN_REPAID);
          },
          onError: error => {
            const errorMessage = error.message;
            if (errorMessage.includes("NotLotteryOwner")) {
              toast.error("You are not the owner of this lottery");
            } else if (errorMessage.includes("IncorrectRepaymentAmount")) {
              toast.error("Incorrect repayment amount");
            } else {
              toast.error(ERROR_MESSAGES.TRANSACTION_REJECTED);
            }
            console.error("Repay loan error:", error);
          },
        },
      );
    } catch (error) {
      toast.error(ERROR_MESSAGES.NETWORK_ERROR);
      console.error("Repay loan error:", error);
    }
  };

  return {
    repayLoan,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error: writeError,
  };
}
