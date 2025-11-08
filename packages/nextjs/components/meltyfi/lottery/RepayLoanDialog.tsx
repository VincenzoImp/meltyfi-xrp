"use client";

import { AlertCircle, RefreshCw, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
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
import { useRepayLoan } from "~~/hooks/meltyfi";
import { BASIS_POINTS, ERROR_MESSAGES, OWNER_PERCENTAGE } from "~~/lib/constants";
import { formatEth } from "~~/lib/utils";
import type { Lottery } from "~~/types/lottery";

interface RepayLoanDialogProps {
  lottery: Lottery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * RepayLoanDialog - Modal for lottery owner to repay loan and cancel lottery
 */
export function RepayLoanDialog({ lottery, open, onOpenChange }: RepayLoanDialogProps) {
  const { address } = useAccount();
  const { repayLoan, isPending, isSuccess } = useRepayLoan();

  if (!lottery) return null;

  const isOwner = address && address.toLowerCase() === lottery.owner.toLowerCase();
  const totalRaised = lottery.totalRaised;
  const refundAmount = (totalRaised * BigInt(OWNER_PERCENTAGE)) / BigInt(BASIS_POINTS);
  const protocolKeeps = totalRaised - refundAmount;

  const handleRepay = async () => {
    if (!isOwner || !address) {
      toast.error(ERROR_MESSAGES.NFT_NOT_OWNED);
      return;
    }

    await repayLoan(lottery.id, refundAmount);
  };

  // Auto-close on success
  if (isSuccess && open) {
    setTimeout(() => onOpenChange(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Repay Loan & Cancel Lottery</DialogTitle>
          <DialogDescription>Cancel this lottery and refund all participants</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Alert */}
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">This action cannot be undone</p>
                <p className="text-xs text-muted-foreground">
                  All participants will be refunded and the lottery will be cancelled. Your NFT will be returned to you.
                </p>
              </div>
            </div>
          </div>

          {/* Lottery Info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="space-y-1">
              <p className="text-sm font-medium">{lottery.nftName}</p>
              <p className="text-xs text-muted-foreground">
                {lottery.wonkaBarsSold} tickets sold • {formatEth(lottery.wonkaBarPrice)} ETH each
              </p>
            </div>
            <Badge variant="secondary">{lottery.wonkaBarsSold} participants</Badge>
          </div>

          <Separator />

          {/* Financial Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Raised</span>
              <span className="font-medium">{formatEth(totalRaised)} ETH</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingDown className="h-4 w-4" />
                Participant Refunds (95%)
              </span>
              <span className="font-medium text-destructive">{formatEth(refundAmount)} ETH</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Protocol Keeps (5%)</span>
              <span className="font-medium">{formatEth(protocolKeeps)} ETH</span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="font-semibold">You Must Pay</span>
              <span className="text-lg font-bold text-destructive">{formatEth(refundAmount)} ETH</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">What happens next?</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>All {lottery.wonkaBarsSold} participants will receive their refund</li>
                  <li>Your NFT will be returned to your wallet</li>
                  <li>The lottery will be marked as cancelled</li>
                  <li>WonkaBars will be burned</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Owner Warning */}
          {!isOwner && (
            <div className="p-3 bg-destructive/10 rounded-lg">
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Only the lottery owner can repay the loan
              </p>
            </div>
          )}

          {/* Wallet Warning */}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleRepay}
            disabled={!isOwner || isPending}
            variant="destructive"
            className="min-w-[120px]"
          >
            {isPending ? "Processing..." : `Repay ${formatEth(refundAmount)} ETH`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
