"use client";

import { AlertCircle, Gift, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useAccount, useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~~/components/ui/dialog";
import { Separator } from "~~/components/ui/separator";
import { ERROR_MESSAGES, LotteryState, SUCCESS_MESSAGES } from "~~/lib/constants";
import { ABIS, getContractsByChainId } from "~~/lib/contracts";
import { formatAddress } from "~~/lib/utils";
import type { Lottery } from "~~/types/lottery";

interface ClaimNFTDialogProps {
  lottery: Lottery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * ClaimNFTDialog - Modal for winner to claim their NFT
 */
export function ClaimNFTDialog({ lottery, open, onOpenChange }: ClaimNFTDialogProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsByChainId(chainId);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (!lottery) return null;

  const isConcluded = lottery.state === LotteryState.CONCLUDED;
  const isWinner = address && lottery.winner && address.toLowerCase() === lottery.winner.toLowerCase();

  const handleClaim = async () => {
    if (!address || !isWinner) {
      toast.error("Only the winner can claim the NFT");
      return;
    }

    try {
      writeContract(
        {
          address: contracts.MeltyFiProtocol,
          abi: ABIS.MeltyFiProtocol,
          functionName: "claimNFT",
          args: [BigInt(lottery.id)],
        },
        {
          onSuccess: () => {
            toast.success(SUCCESS_MESSAGES.NFT_CLAIMED);
          },
          onError: error => {
            const errorMessage = error.message;
            if (errorMessage.includes("NotWinner")) {
              toast.error("You are not the winner of this lottery");
            } else if (errorMessage.includes("LotteryNotCompleted")) {
              toast.error("Lottery is not completed yet");
            } else {
              toast.error(ERROR_MESSAGES.TRANSACTION_REJECTED);
            }
            console.error("Claim NFT error:", error);
          },
        },
      );
    } catch (error) {
      toast.error(ERROR_MESSAGES.NETWORK_ERROR);
      console.error("Claim NFT error:", error);
    }
  };

  // Auto-close on success
  if (isSuccess && open) {
    setTimeout(() => onOpenChange(false), 2000);
  }

  const loading = isPending || isConfirming;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Claim Your NFT</DialogTitle>
          <DialogDescription>Congratulations! You won the lottery</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Congratulations Alert */}
          <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
            <div className="flex gap-3">
              <Trophy className="h-6 w-6 text-yellow-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">You Won!</p>
                <p className="text-xs text-muted-foreground">
                  Congratulations on winning this NFT lottery. Click below to claim your prize.
                </p>
              </div>
            </div>
          </div>

          {/* NFT Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">{lottery.nftName}</p>
                <p className="text-xs text-muted-foreground">Contract: {formatAddress(lottery.nftContract, 6)}</p>
                <p className="text-xs text-muted-foreground">Token ID: #{lottery.nftTokenId.toString()}</p>
              </div>
              <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                Winner
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Claim Info */}
          <div className="p-3 bg-primary/5 rounded-lg">
            <div className="flex gap-2 mb-2">
              <Gift className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs font-medium">What happens when you claim?</p>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside ml-6">
              <li>The NFT will be transferred to your wallet</li>
              <li>The lottery will be finalized</li>
              <li>Transaction requires gas fees</li>
            </ul>
          </div>

          {/* Winner Verification */}
          {lottery.winner && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Winner Address:</span>
                <code className="bg-background px-2 py-1 rounded">{formatAddress(lottery.winner)}</code>
              </div>
              {isWinner && (
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <Trophy className="h-3 w-3" />
                  <span className="font-medium">This is you!</span>
                </div>
              )}
            </div>
          )}

          {/* Warnings */}
          {!isConcluded && (
            <div className="p-3 bg-destructive/10 rounded-lg">
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Lottery must be concluded before claiming
              </p>
            </div>
          )}

          {!isWinner && address && (
            <div className="p-3 bg-destructive/10 rounded-lg">
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Only the winner can claim the NFT
              </p>
            </div>
          )}

          {!address && (
            <div className="p-3 bg-destructive/10 rounded-lg">
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {ERROR_MESSAGES.WALLET_NOT_CONNECTED}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleClaim}
            disabled={!address || !isConcluded || !isWinner || loading}
            className="min-w-[120px] bg-yellow-500 hover:bg-yellow-600"
          >
            {loading ? "Claiming..." : "Claim NFT"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
