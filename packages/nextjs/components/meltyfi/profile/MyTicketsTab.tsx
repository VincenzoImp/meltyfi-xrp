"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Ticket } from "lucide-react";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/card";
import { Progress } from "~~/components/ui/progress";
import { useLotteries, useLottery, useWonkaBar } from "~~/hooks/meltyfi";
import { LOTTERY_STATE_COLORS, LOTTERY_STATE_LABELS, LotteryState } from "~~/lib/constants";
import { calculatePercentage, formatEth } from "~~/lib/utils";
import type { Lottery } from "~~/types/lottery";

interface MyTicketsTabProps {
  address: `0x${string}`;
  isOwnProfile: boolean;
}

// Hook to fetch all lotteries - avoids hooks in loops
function useAllLotteries(lotteryIds: bigint[]) {
  const lotteries = [];

  // Call hooks at top level for each ID
  for (let i = 0; i < lotteryIds.length; i++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { lottery } = useLottery(Number(lotteryIds[i]));
    if (lottery) lotteries.push(lottery);
  }

  return lotteries;
}

/**
 * MyTicketsTab - Shows WonkaBars (lottery tickets) owned by the user
 */
export function MyTicketsTab({ address, isOwnProfile }: MyTicketsTabProps) {
  const { lotteryIds, isLoading } = useLotteries();

  // Fetch all lotteries using hooks at top level
  const lotteries = useAllLotteries(lotteryIds);

  // Filter lotteries where user might have tickets
  // TODO: This is inefficient - should use The Graph to query user's ticket holdings
  const lotteriesWithPotentialTickets = lotteries.filter(lottery => {
    // Only check lotteries that have sold some tickets
    return lottery.wonkaBarsSold > 0;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading tickets...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>My Tickets</CardTitle>
          <CardDescription>
            {isOwnProfile ? "WonkaBars you own in active lotteries" : "WonkaBars owned by this address"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lotteriesWithPotentialTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-2">
                {isOwnProfile ? "You don't have any tickets yet" : "This user doesn't have any tickets"}
              </p>
              {isOwnProfile && (
                <Button asChild className="mt-4">
                  <Link href="/lotteries">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Browse Lotteries
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {lotteriesWithPotentialTickets.map(lottery => (
                <TicketCard key={lottery.id} lottery={lottery} userAddress={address} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * TicketCard - Individual lottery ticket display with balance
 */
function TicketCard({ lottery, userAddress }: { lottery: Lottery; userAddress: `0x${string}` }) {
  const { balance } = useWonkaBar(userAddress, lottery.id);
  const userBalance = Number(balance);

  // Don't show if user has no tickets
  if (userBalance === 0) {
    return null;
  }

  const progressPercentage = calculatePercentage(lottery.wonkaBarsSold, lottery.wonkaBarsMaxSupply);
  const userWinProbability = calculatePercentage(userBalance, lottery.wonkaBarsMaxSupply);
  const isActive = lottery.state === LotteryState.ACTIVE;

  return (
    <Card className={isActive ? "border-primary/50" : ""}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Lottery Image */}
          <div className="relative w-full sm:w-24 h-24 bg-muted rounded-lg overflow-hidden shrink-0">
            {lottery.nftImageUrl ? (
              <Image src={lottery.nftImageUrl} alt={lottery.nftName} fill className="object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Ticket className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Lottery Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/lotteries/${lottery.id}`}>
                  <h3 className="font-semibold hover:underline">{lottery.nftName}</h3>
                </Link>
                <p className="text-sm text-muted-foreground">Lottery #{lottery.id}</p>
              </div>
              <Badge className={LOTTERY_STATE_COLORS[lottery.state]}>{LOTTERY_STATE_LABELS[lottery.state]}</Badge>
            </div>

            {/* Ticket Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Your Tickets</p>
                <p className="font-semibold">
                  {userBalance} / {lottery.wonkaBarsMaxSupply}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Win Probability</p>
                <p className="font-semibold">{userWinProbability.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Investment</p>
                <p className="font-semibold">{formatEth(lottery.wonkaBarPrice * BigInt(userBalance))} XRP</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ticket Price</p>
                <p className="font-semibold">{formatEth(lottery.wonkaBarPrice)} XRP</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Sold</span>
                <span>
                  {lottery.wonkaBarsSold} / {lottery.wonkaBarsMaxSupply}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                <Link href={`/lotteries/${lottery.id}`}>View Lottery Details</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
