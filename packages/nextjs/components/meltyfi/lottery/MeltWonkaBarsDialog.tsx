"use client";

import { AlertCircle, Flame, TrendingUp } from "lucide-react";
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
import { useWonkaBar } from "~~/hooks/meltyfi";
import { ERROR_MESSAGES, LotteryState, SUCCESS_MESSAGES } from "~~/lib/constants";
import { ABIS, getContracts } from "~~/lib/contracts";
import { formatEth } from "~~/lib/utils";
import type { Lottery } from "~~/types/lottery";

interface MeltWonkaBarsDialogProps {
  lottery: Lottery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * MeltWonkaBarsDialog - Modal for melting (burning) WonkaBars to get refund
 */
export function MeltWonkaBarsDialog({ lottery, open, onOpenChange }: MeltWonkaBarsDialogProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const networkName = chainId === 31337 ? "localhost" : "sepolia";
  const contracts = getContracts(networkName);

  const { balance: userBalance } = useWonkaBar(address as `0x${string}` | undefined, lottery?.id);
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (!lottery) return null;

  const isCancelled = lottery.state === LotteryState.CANCELLED;
  const refundAmount = lottery.wonkaBarPrice * userBalance;
  const hasBalance = userBalance > 0n;

  const handleMelt = async () => {
    if (!address || !hasBalance) {
      toast.error(ERROR_MESSAGES.INVALID_INPUT);
      return;
    }

    try {
      writeContract(
        {
          address: contracts.MeltyFiProtocol,
          abi: ABIS.MeltyFiProtocol,
          functionName: "meltWonkaBars",
          args: [BigInt(lottery.id)],
        },
        {
          onSuccess: () => {
            toast.success(SUCCESS_MESSAGES.WONKA_BARS_MELTED);
          },
          onError: error => {
            const errorMessage = error.message;
            if (errorMessage.includes("LotteryNotCancelled")) {
              toast.error("Lottery must be cancelled to melt tickets");
            } else if (errorMessage.includes("NoWonkaBars")) {
              toast.error("You don't have any tickets to melt");
            } else {
              toast.error(ERROR_MESSAGES.TRANSACTION_REJECTED);
            }
            console.error("Melt WonkaBars error:", error);
          },
        },
      );
    } catch (error) {
      toast.error(ERROR_MESSAGES.NETWORK_ERROR);
      console.error("Melt WonkaBars error:", error);
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
          <DialogTitle>Melt WonkaBars</DialogTitle>
          <DialogDescription>Burn your tickets to receive a refund</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info Alert */}
          <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <div className="flex gap-2">
              <Flame className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Lottery Cancelled</p>
                <p className="text-xs text-muted-foreground">
                  This lottery has been cancelled. You can melt (burn) your WonkaBars to receive a full refund.
                </p>
              </div>
            </div>
          </div>

          {/* Lottery Info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="space-y-1">
              <p className="text-sm font-medium">{lottery.nftName}</p>
              <p className="text-xs text-muted-foreground">{formatEth(lottery.wonkaBarPrice)} ETH per ticket</p>
            </div>
            <Badge variant="secondary">Cancelled</Badge>
          </div>

          <Separator />

          {/* User's Holdings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your WonkaBars</span>
              <span className="font-medium">{userBalance.toString()} tickets</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ticket Price</span>
              <span className="font-medium">{formatEth(lottery.wonkaBarPrice)} ETH</span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-green-500" />
                You Will Receive
              </span>
              <span className="text-lg font-bold text-green-500">{formatEth(refundAmount)} ETH</span>
            </div>
          </div>

          {/* What Happens */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium mb-2">What happens when you melt?</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>
                Your {userBalance.toString()} WonkaBar{Number(userBalance) !== 1 ? "s" : ""} will be burned
              </li>
              <li>You will receive {formatEth(refundAmount)} ETH refund</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>

          {/* Warnings */}
          {!isCancelled && (
            <div className="p-3 bg-destructive/10 rounded-lg">
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {ERROR_MESSAGES.LOTTERY_INACTIVE}
              </p>
            </div>
          )}

          {!hasBalance && isCancelled && (
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
            disabled={!address || !isCancelled || !hasBalance || loading}
            className="min-w-[120px]"
          >
            {loading ? "Melting..." : `Melt for ${formatEth(refundAmount)} ETH`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
