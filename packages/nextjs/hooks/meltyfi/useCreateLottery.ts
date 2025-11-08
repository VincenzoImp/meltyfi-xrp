import { useState } from "react";
import { useChainId, usePublicClient, useWriteContract } from "wagmi";
import { useTransactor } from "~~/hooks/scaffold-eth";
import { ABIS, getContractsByChainId } from "~~/lib/contracts";
import { parseEthToWei } from "~~/lib/utils";
import type { CreateLotteryFormData } from "~~/types/lottery";
import { notification } from "~~/utils/scaffold-eth";

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
  const writeTx = useTransactor();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const createLottery = async (formData: CreateLotteryFormData) => {
    try {
      if (!publicClient) {
        notification.error("Wallet not connected");
        return;
      }

      setIsPending(true);
      setIsSuccess(false);

      // Step 1: Check if NFT is already approved
      const approved = await publicClient.readContract({
        address: formData.nftContract,
        abi: ERC721_APPROVE_ABI,
        functionName: "getApproved",
        args: [formData.nftTokenId],
      });

      // Step 2: Approve NFT if not already approved
      if (approved.toLowerCase() !== contracts.MeltyFiProtocol.toLowerCase()) {
        notification.info("Approving NFT transfer...");

        await writeTx(
          () =>
            writeContractAsync({
              address: formData.nftContract,
              abi: ERC721_APPROVE_ABI,
              functionName: "approve",
              args: [contracts.MeltyFiProtocol, formData.nftTokenId],
            }),
          { blockConfirmations: 1 },
        );
      }

      // Step 3: Create the lottery
      const wonkaBarPriceWei = parseEthToWei(formData.wonkaBarPrice);

      await writeTx(
        () =>
          writeContractAsync({
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
          }),
        { blockConfirmations: 1 },
      );

      setIsSuccess(true);
    } catch (error) {
      console.error("Create lottery error:", error);
      setIsSuccess(false);
    } finally {
      setIsPending(false);
    }
  };

  return {
    createLottery,
    isPending,
    isSuccess,
  };
}
