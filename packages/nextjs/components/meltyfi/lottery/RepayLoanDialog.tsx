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
import { formatXrp } from "~~/lib/utils";
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
  const { repayLoan, isPending, isSuccess, error: repayError, canTransact } = useRepayLoan();

  if (!lottery) return null;

  const isOwner = address && address.toLowerCase() === lottery.owner.toLowerCase();
  const totalRaised = lottery.totalRaised;
  const ownerInitialPayout = (totalRaised * BigInt(OWNER_PERCENTAGE)) / BigInt(BASIS_POINTS);
  const protocolFee = totalRaised - ownerInitialPayout;
  const repaymentAmount = totalRaised;
  const netCost = repaymentAmount - ownerInitialPayout;

  const handleRepay = async () => {
    if (!isOwner || !address) {
      toast.error(ERROR_MESSAGES.NFT_NOT_OWNED);
      return;
    }

    await repayLoan(lottery.id, repaymentAmount);
  };

  const canRepay = isOwner && canTransact && !isPending;

  // Auto-close on success
  if (isSuccess && open) {
    setTimeout(() => onOpenChange(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Repay Loan & Cancel Lottery</DialogTitle>
          <DialogDescription>Cancel this lottery and enable participants to claim refunds</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Alert */}
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">This action cannot be undone</p>
                <p className="text-xs text-muted-foreground">
                  Participants will be able to melt their WonkaBars to claim refunds. Your NFT will be returned to you.
                </p>
              </div>
            </div>
          </div>

          {/* Lottery Info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="space-y-1">
              <p className="text-sm font-medium">{lottery.nftName}</p>
              <p className="text-xs text-muted-foreground">
                {lottery.wonkaBarsSold} tickets sold • {formatXrp(lottery.wonkaBarPrice)} XRP each
              </p>
            </div>
            <Badge variant="secondary">{lottery.wonkaBarsSold} participants</Badge>
          </div>

          <Separator />

          {/* Financial Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Raised</span>
              <span className="font-medium">{formatXrp(totalRaised)} XRP</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingDown className="h-4 w-4" />
                Funds to repay participants (100%)
              </span>
              <span className="font-medium text-destructive">{formatXrp(repaymentAmount)} XRP</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">You already received (95%)</span>
              <span className="font-medium">{formatXrp(ownerInitialPayout)} XRP</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Protocol fee retained (5%)</span>
              <span className="font-medium">{formatXrp(protocolFee)} XRP</span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="font-semibold">Repayment Amount</span>
              <span className="text-lg font-bold text-destructive">{formatXrp(repaymentAmount)} XRP</span>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• You received {formatXrp(ownerInitialPayout)} XRP immediately after the sale (95%)</p>
              <p>• You must repay the full {formatXrp(repaymentAmount)} XRP collected to cancel</p>
              <p>• Net cost of cancellation: {formatXrp(netCost)} XRP (the 5% protocol fee)</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">What happens next?</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Your NFT will be returned to your wallet</li>
                  <li>The lottery will be marked as CANCELLED</li>
                  <li>{lottery.wonkaBarsSold} participants can melt WonkaBars to claim refunds + CHOC</li>
                  <li>Each participant must call meltWonkaBars() to burn tickets and get refund</li>
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

          {!canTransact && (
            <div className="p-3 bg-destructive/10 rounded-lg">
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Contract not available on this network. Please switch to a supported network.
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
            disabled={!canRepay}
            variant="destructive"
            className="min-w-[120px]"
          >
            {isPending ? "Processing..." : `Repay ${formatXrp(repaymentAmount)} XRP`}
          </Button>
        </DialogFooter>

        {repayError && (
          <div className="pt-3">
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-xs flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <p>{repayError.message}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
