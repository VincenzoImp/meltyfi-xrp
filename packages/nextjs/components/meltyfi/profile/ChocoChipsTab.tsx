"use client";

import { Clock, Info, TrendingUp, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/card";
import { useChocoChip } from "~~/hooks/meltyfi";
import { CHOCO_CHIPS_PER_ETH } from "~~/lib/constants";
import { formatNumber } from "~~/lib/utils";

interface ChocoChipsTabProps {
  address: `0x${string}`;
  isOwnProfile: boolean;
}

/**
 * ChocoChipsTab - Shows ChocoChip (CHOC) balance and earning history
 */
export function ChocoChipsTab({ address, isOwnProfile }: ChocoChipsTabProps) {
  const { balance, isLoading } = useChocoChip(address);

  // TODO: Fetch earning history from The Graph
  const earningHistory = [
    // { type: "purchase", amount: 1000n, timestamp: ..., lotteryId: ... },
    // { type: "win", amount: 5000n, timestamp: ..., lotteryId: ... },
  ];

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            ChocoChips Balance
          </CardTitle>
          <CardDescription>
            {isOwnProfile ? "Your loyalty tokens earned from MeltyFi activity" : "ChocoChips owned by this address"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
              <p className="text-4xl font-bold text-primary mb-2">{isLoading ? "..." : formatNumber(balance)} CHOC</p>
              <p className="text-sm text-muted-foreground">Total ChocoChips Balance</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Earned from Tickets</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Earned from Wins</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Earn */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How to Earn ChocoChips
          </CardTitle>
          <CardDescription>Ways to earn loyalty tokens on MeltyFi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3 p-3 bg-muted rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Purchase WonkaBars</p>
                <p className="text-xs text-muted-foreground">
                  Earn {formatNumber(CHOCO_CHIPS_PER_ETH)} CHOC per 1 ETH spent on lottery tickets
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-muted rounded-lg">
              <Trophy className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Win Lotteries</p>
                <p className="text-xs text-muted-foreground">Bonus ChocoChips awarded when you win NFT lotteries</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-muted rounded-lg opacity-50">
              <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">More Ways Coming Soon</p>
                <p className="text-xs text-muted-foreground">
                  Additional earning mechanisms will be introduced through governance
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earning History */}
      <Card>
        <CardHeader>
          <CardTitle>Earning History</CardTitle>
          <CardDescription>
            {isOwnProfile ? "Your ChocoChips earning history" : "ChocoChips earned by this address"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {earningHistory.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No earning history yet</p>
              <p className="text-sm text-muted-foreground mt-1">Start buying tickets to earn ChocoChips!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* TODO: Map earning history items */}
              <p className="text-sm text-muted-foreground">Earning history coming soon...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future Utility */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">Future Utility</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            ChocoChips will be used for governance voting and future platform features. Hold your CHOC to participate in
            protocol decisions and unlock exclusive benefits.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
