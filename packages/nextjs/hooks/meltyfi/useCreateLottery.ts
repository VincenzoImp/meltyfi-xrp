import { useState } from "react";
import { toast } from "sonner";
import { useChainId, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "~~/lib/constants";
import { ABIS, getContractsByChainId } from "~~/lib/contracts";
import { parseEthToWei } from "~~/lib/utils";
import type { CreateLotteryFormData } from "~~/types/lottery";

// ERC721 approve ABI
const ERC721_APPROVE_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getApproved",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Hook to create a new lottery with NFT approval handling
 */
export function useCreateLottery() {
  const chainId = useChainId();
  const contracts = getContractsByChainId(chainId);
  const publicClient = usePublicClient();
  const [isApproving, setIsApproving] = useState(false);

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createLottery = async (formData: CreateLotteryFormData) => {
    try {
      if (!publicClient) {
        toast.error("Wallet not connected");
        return;
      }

      // Step 1: Check if NFT is already approved
      const approved = await publicClient.readContract({
        address: formData.nftContract,
        abi: ERC721_APPROVE_ABI,
        functionName: "getApproved",
        args: [formData.nftTokenId],
      });

      // Step 2: Approve NFT if not already approved
      if (approved.toLowerCase() !== contracts.MeltyFiProtocol.toLowerCase()) {
        setIsApproving(true);
        toast.info("Please approve the NFT transfer first...");

        // Approve the NFT
        await new Promise<void>((resolve, reject) => {
          writeContract(
            {
              address: formData.nftContract,
              abi: ERC721_APPROVE_ABI,
              functionName: "approve",
              args: [contracts.MeltyFiProtocol, formData.nftTokenId],
            },
            {
              onSuccess: async txHash => {
                // Wait for approval transaction to be mined
                const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
                if (receipt.status === "success") {
                  toast.success("NFT approved successfully!");
                  setIsApproving(false);
                  resolve();
                } else {
                  toast.error("NFT approval failed");
                  setIsApproving(false);
                  reject(new Error("Approval failed"));
                }
              },
              onError: error => {
                toast.error("NFT approval rejected");
                console.error("Approval error:", error);
                setIsApproving(false);
                reject(error);
              },
            },
          );
        });
      }

      // Step 3: Create the lottery
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
      setIsApproving(false);
      toast.error(ERROR_MESSAGES.INVALID_INPUT);
      console.error("Create lottery error:", error);
    }
  };

  return {
    createLottery,
    hash,
    isPending: isPending || isConfirming || isApproving,
    isSuccess,
    error: writeError,
  };
}
