import { toast } from "sonner";
import { useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "~~/lib/constants";
import { ABIS, getContracts } from "~~/lib/contracts";

/**
 * Hook to buy WonkaBars in a lottery
 */
export function useBuyWonkaBars() {
  const chainId = useChainId();
  const networkName = chainId === 31337 ? "localhost" : "sepolia";
  const contracts = getContracts(networkName);

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const buyWonkaBars = async (lotteryId: number, amount: number, totalCost: bigint) => {
    try {
      writeContract(
        {
          address: contracts.MeltyFiProtocol,
          abi: ABIS.MeltyFiProtocol,
          functionName: "buyWonkaBars",
          args: [BigInt(lotteryId), BigInt(amount)],
          value: totalCost,
        },
        {
          onSuccess: () => {
            toast.success(SUCCESS_MESSAGES.WONKA_BARS_PURCHASED);
          },
          onError: error => {
            const errorMessage = error.message;
            if (errorMessage.includes("InsufficientPayment")) {
              toast.error(ERROR_MESSAGES.INSUFFICIENT_BALANCE);
            } else if (errorMessage.includes("ExceedsMaxBalance")) {
              toast.error(ERROR_MESSAGES.MAX_BALANCE_EXCEEDED);
            } else if (errorMessage.includes("ExceedsMaxSupply")) {
              toast.error(ERROR_MESSAGES.MAX_SUPPLY_EXCEEDED);
            } else {
              toast.error(ERROR_MESSAGES.TRANSACTION_REJECTED);
            }
            console.error("Buy WonkaBars error:", error);
          },
        },
      );
    } catch (error) {
      toast.error(ERROR_MESSAGES.NETWORK_ERROR);
      console.error("Buy WonkaBars error:", error);
    }
  };

  return {
    buyWonkaBars,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error: writeError,
  };
}
