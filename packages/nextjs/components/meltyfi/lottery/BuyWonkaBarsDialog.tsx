"use client";

import { useState } from "react";
import { AlertCircle, Gift, Ticket, TrendingUp } from "lucide-react";
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
import { Input } from "~~/components/ui/input";
import { Label } from "~~/components/ui/label";
import { Separator } from "~~/components/ui/separator";
import { useBuyWonkaBars } from "~~/hooks/meltyfi";
import { useWonkaBar } from "~~/hooks/meltyfi";
import { CHOCO_CHIPS_PER_ETH, ERROR_MESSAGES, MAX_USER_BALANCE_PERCENTAGE } from "~~/lib/constants";
import { calculatePercentage, formatEth } from "~~/lib/utils";
import type { Lottery } from "~~/types/lottery";

interface BuyWonkaBarsDialogProps {
  lottery: Lottery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * BuyWonkaBarsDialog - Modal for purchasing lottery tickets (WonkaBars)
 */
export function BuyWonkaBarsDialog({ lottery, open, onOpenChange }: BuyWonkaBarsDialogProps) {
  const { address } = useAccount();
  const [quantity, setQuantity] = useState("1");
  const { buyWonkaBars, isPending, isSuccess } = useBuyWonkaBars();
  const { balance: userBalance } = useWonkaBar(address as `0x${string}` | undefined, lottery?.id);

  if (!lottery) return null;

  const quantityNum = parseInt(quantity) || 0;
  const totalCost = lottery.wonkaBarPrice * BigInt(quantityNum);
  const chocoChipsReward = BigInt(quantityNum) * CHOCO_CHIPS_PER_ETH;
  const remaining = lottery.wonkaBarsMaxSupply - lottery.wonkaBarsSold;
  const maxPurchase = Math.min(
    remaining,
    Math.floor((lottery.wonkaBarsMaxSupply * MAX_USER_BALANCE_PERCENTAGE) / 100) - Number(userBalance),
  );

  const userWinProbability = calculatePercentage(Number(userBalance) + quantityNum, lottery.wonkaBarsMaxSupply);

  const isValidQuantity = quantityNum > 0 && quantityNum <= maxPurchase;
  const canBuy = isValidQuantity && !isPending && address;

  const handleBuy = async () => {
    if (!canBuy || !address) return;

    await buyWonkaBars(lottery.id, quantityNum, totalCost);
  };

  // Auto-close on success
  if (isSuccess && open) {
    setTimeout(() => onOpenChange(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buy WonkaBars</DialogTitle>
          <DialogDescription>Purchase lottery tickets for {lottery.nftName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Lottery Info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="space-y-1">
              <p className="text-sm font-medium">{lottery.nftName}</p>
              <p className="text-xs text-muted-foreground">{formatEth(lottery.wonkaBarPrice)} ETH per ticket</p>
            </div>
            <Badge variant="secondary">
              {remaining} / {lottery.wonkaBarsMaxSupply} left
            </Badge>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <div className="flex gap-2">
              <Input
                id="quantity"
                type="number"
                min="1"
                max={maxPurchase}
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
              <Button
                variant="outline"
                onClick={() => setQuantity(maxPurchase.toString())}
                disabled={maxPurchase === 0}
              >
                Max
              </Button>
            </div>
            {quantityNum > maxPurchase && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {ERROR_MESSAGES.MAX_BALANCE_EXCEEDED}
              </p>
            )}
          </div>

          <Separator />

          {/* Purchase Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Ticket className="h-4 w-4" />
                Total Cost
              </span>
              <span className="font-medium">{formatEth(totalCost)} ETH</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Gift className="h-4 w-4" />
                CHOC Rewards
              </span>
              <span className="font-medium">{chocoChipsReward.toString()} CHOC</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Win Probability
              </span>
              <span className="font-medium">{userWinProbability.toFixed(2)}%</span>
            </div>
          </div>

          {/* User's Current Holdings */}
          {Number(userBalance) > 0 && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Your current tickets</p>
              <p className="text-sm font-medium">{userBalance.toString()} WonkaBars</p>
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
          <Button onClick={handleBuy} disabled={!canBuy} className="min-w-[120px]">
            {isPending ? "Buying..." : `Buy ${quantityNum} Ticket${quantityNum !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
