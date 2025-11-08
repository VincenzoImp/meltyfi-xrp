import { toast } from "sonner";
import { useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "~~/lib/constants";
import { ABIS, getContracts } from "~~/lib/contracts";
import { parseEthToWei } from "~~/lib/utils";
import type { CreateLotteryFormData } from "~~/types/lottery";

/**
 * Hook to create a new lottery
 */
export function useCreateLottery() {
  const chainId = useChainId();
  const networkName = chainId === 31337 ? "localhost" : "sepolia";
  const contracts = getContracts(networkName);

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createLottery = async (formData: CreateLotteryFormData) => {
    try {
      const wonkaBarPriceWei = parseEthToWei(formData.wonkaBarPrice);

      writeContract(
        {
          address: contracts.MeltyFiProtocol,
          abi: ABIS.MeltyFiProtocol,
          functionName: "createLottery",
          args: [
            formData.nftContract,
            formData.nftTokenId,
            wonkaBarPriceWei,
            BigInt(formData.wonkaBarsMaxSupply),
            BigInt(formData.durationInDays),
            formData.nftName,
            formData.nftImageUrl,
          ],
        },
        {
          onSuccess: () => {
            toast.success(SUCCESS_MESSAGES.LOTTERY_CREATED);
          },
          onError: error => {
            toast.error(ERROR_MESSAGES.TRANSACTION_REJECTED);
            console.error("Create lottery error:", error);
          },
        },
      );
    } catch (error) {
      toast.error(ERROR_MESSAGES.INVALID_INPUT);
      console.error("Create lottery error:", error);
    }
  };

  return {
    createLottery,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error: writeError,
  };
}
