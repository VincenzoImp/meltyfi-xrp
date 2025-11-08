"use client";

import { useState } from "react";
import { AlertCircle, Flame, TrendingUp } from "lucide-react";
import { useAccount, useChainId, useWriteContract } from "wagmi";
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
import { useWonkaBar } from "~~/hooks/meltyfi";
import { useTransactor } from "~~/hooks/scaffold-eth";
import { ERROR_MESSAGES, LotteryState } from "~~/lib/constants";
import { ABIS, getContractsByChainId } from "~~/lib/contracts";
import { formatEth } from "~~/lib/utils";
import type { Lottery } from "~~/types/lottery";
import { notification } from "~~/utils/scaffold-eth";

interface MeltWonkaBarsDialogProps {
  lottery: Lottery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * MeltWonkaBarsDialog - Modal for melting (burning) WonkaBars to claim rewards
 * Handles CANCELLED (refund + CHOC) and CONCLUDED (CHOC only for non-winners)
 */
export function MeltWonkaBarsDialog({ lottery, open, onOpenChange }: MeltWonkaBarsDialogProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsByChainId(chainId);
  const writeTx = useTransactor();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { balance: userBalance } = useWonkaBar(address as `0x${string}` | undefined, lottery?.id);

  if (!lottery) return null;

  const isCancelled = lottery.state === LotteryState.CANCELLED;
  const isConcluded = lottery.state === LotteryState.CONCLUDED;
  const isWinner = address && address.toLowerCase() === lottery.winner?.toLowerCase();
  const canMelt = isCancelled || (isConcluded && !isWinner);
  const refundAmount = lottery.wonkaBarPrice * userBalance;
  const hasBalance = userBalance > 0n;

  // Calculate ChocoChips reward (1000 CHOC per 1 XRP spent)
  const chocoChipsReward = (refundAmount * BigInt(1000)) / BigInt(10 ** 18);

  const handleMelt = async () => {
    if (!address || !hasBalance || !canMelt) {
      notification.error(ERROR_MESSAGES.INVALID_INPUT);
      return;
    }

    try {
      setIsPending(true);
      setIsSuccess(false);

      await writeTx(
        () =>
          writeContractAsync({
            address: contracts.MeltyFiProtocol,
            abi: ABIS.MeltyFiProtocol,
            functionName: "meltWonkaBars",
            args: [BigInt(lottery.id)],
          }),
        { blockConfirmations: 1 },
      );

      setIsSuccess(true);
    } catch (error) {
      console.error("Melt WonkaBars error:", error);
      setIsSuccess(false);
    } finally {
      setIsPending(false);
    }
  };

  // Auto-close on success
  if (isSuccess && open) {
    setTimeout(() => onOpenChange(false), 2000);
  }

  const loading = isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Melt WonkaBars</DialogTitle>
          <DialogDescription>
            {isCancelled ? "Burn your tickets to receive a refund + CHOC" : "Burn your tickets to receive CHOC rewards"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info Alert */}
          <div
            className={`p-3 rounded-lg border ${
              isCancelled ? "bg-orange-500/10 border-orange-500/20" : "bg-blue-500/10 border-blue-500/20"
            }`}
          >
            <div className="flex gap-2">
              <Flame className={`h-5 w-5 shrink-0 mt-0.5 ${isCancelled ? "text-orange-500" : "text-blue-500"}`} />
              <div className="space-y-1">
                <p
                  className={`text-sm font-medium ${
                    isCancelled ? "text-orange-700 dark:text-orange-400" : "text-blue-700 dark:text-blue-400"
                  }`}
                >
                  {isCancelled ? "Lottery Cancelled - Claim Refund" : "Lottery Concluded - Non-Winner"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isCancelled
                    ? "Owner repaid the loan. Melt (burn) your WonkaBars to receive XRP refund + ChocoChips."
                    : "Sorry, you didn't win. Melt (burn) your WonkaBars to receive ChocoChips as consolation."}
                </p>
              </div>
            </div>
          </div>

          {/* Lottery Info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="space-y-1">
              <p className="text-sm font-medium">{lottery.nftName}</p>
              <p className="text-xs text-muted-foreground">{formatEth(lottery.wonkaBarPrice)} XRP per ticket</p>
            </div>
            <Badge variant="secondary">{isCancelled ? "Cancelled" : "Concluded"}</Badge>
          </div>

          <Separator />

          {/* User's Holdings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your WonkaBars</span>
              <span className="font-medium">{userBalance.toString()} tickets</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Original Investment</span>
              <span className="font-medium">{formatEth(refundAmount)} XRP</span>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-green-500" />
                You Will Receive:
              </p>

              {isCancelled && (
                <div className="flex items-center justify-between pl-6">
                  <span className="text-sm text-muted-foreground">XRP Refund</span>
                  <span className="font-bold text-green-500">{formatEth(refundAmount)} XRP</span>
                </div>
              )}

              <div className="flex items-center justify-between pl-6">
                <span className="text-sm text-muted-foreground">ChocoChips (CHOC)</span>
                <span className="font-bold text-primary">{chocoChipsReward.toString()} CHOC</span>
              </div>

              {!isCancelled && (
                <p className="text-xs text-muted-foreground pl-6">(Consolation reward for participating)</p>
              )}
            </div>
          </div>

          {/* What Happens */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium mb-2">What happens when you melt?</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>
                Your {userBalance.toString()} WonkaBar{Number(userBalance) !== 1 ? "s" : ""} will be burned (destroyed)
              </li>
              {isCancelled && <li>You will receive {formatEth(refundAmount)} XRP refunded to your wallet</li>}
              <li>You will receive {chocoChipsReward.toString()} CHOC (ChocoChips) tokens</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>

          {/* Warnings */}
          {!canMelt && (
            <div className="p-3 bg-destructive/10 rounded-lg">
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {isWinner
                  ? "You won! Please claim your NFT instead of melting tickets"
                  : "Lottery must be cancelled or concluded to melt tickets"}
              </p>
            </div>
          )}

          {!hasBalance && canMelt && (
            <div className="p-3 bg-destructive/10 rounded-lg">
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                You don&apos;t have any WonkaBars to melt in this lottery
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
            onClick={handleMelt}
            disabled={!address || !canMelt || !hasBalance || loading}
            className="min-w-[120px]"
          >
            {loading
              ? "Melting..."
              : isCancelled
                ? `Melt for ${formatEth(refundAmount)} XRP + CHOC`
                : `Melt for ${chocoChipsReward.toString()} CHOC`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
