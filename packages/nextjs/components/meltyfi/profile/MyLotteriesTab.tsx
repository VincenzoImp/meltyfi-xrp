"use client";

import Link from "next/link";
import { Plus, Ticket } from "lucide-react";
import { LotteryGrid } from "~~/components/meltyfi";
import { Button } from "~~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~~/components/ui/tabs";
import { useLotteries, useLottery } from "~~/hooks/meltyfi";
import { LotteryState } from "~~/lib/constants";

interface MyLotteriesTabProps {
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
 * MyLotteriesTab - Shows lotteries created by the user
 */
export function MyLotteriesTab({ address, isOwnProfile }: MyLotteriesTabProps) {
  const { lotteryIds, isLoading } = useLotteries();

  // Fetch all lotteries using hooks at top level
  const lotteries = useAllLotteries(lotteryIds);

  // Filter lotteries by owner
  const userLotteries = lotteries.filter(lottery => lottery.owner.toLowerCase() === address.toLowerCase());

  const activeLotteries = userLotteries.filter(lottery => lottery.state === LotteryState.ACTIVE);
  const concludedLotteries = userLotteries.filter(lottery => lottery.state === LotteryState.CONCLUDED);
  const cancelledLotteries = userLotteries.filter(lottery => lottery.state === LotteryState.CANCELLED);
  const trashedLotteries = userLotteries.filter(lottery => lottery.state === LotteryState.TRASHED);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading lotteries...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userLotteries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-2">
              {isOwnProfile ? "You haven't created any lotteries yet" : "This user hasn't created any lotteries yet"}
            </p>
            {isOwnProfile && (
              <Button asChild className="mt-4">
                <Link href="/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Lottery
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Lotteries Created</CardTitle>
          <CardDescription>
            {isOwnProfile ? "All lotteries you've created on MeltyFi" : `All lotteries created by this user`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{userLotteries.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeLotteries.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="text-center p-3 bg-blue-500/10 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{concludedLotteries.length}</p>
              <p className="text-xs text-muted-foreground">Concluded</p>
            </div>
            <div className="text-center p-3 bg-gray-500/10 rounded-lg">
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {cancelledLotteries.length + trashedLotteries.length}
              </p>
              <p className="text-xs text-muted-foreground">Cancelled/Trashed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtered Lotteries */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({userLotteries.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeLotteries.length})</TabsTrigger>
          <TabsTrigger value="concluded">Concluded ({concludedLotteries.length})</TabsTrigger>
          <TabsTrigger value="other">Other ({cancelledLotteries.length + trashedLotteries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <LotteryGrid lotteries={userLotteries} />
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          {activeLotteries.length > 0 ? (
            <LotteryGrid lotteries={activeLotteries} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">No active lotteries</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="concluded" className="mt-6">
          {concludedLotteries.length > 0 ? (
            <LotteryGrid lotteries={concludedLotteries} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">No concluded lotteries</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="other" className="mt-6">
          {cancelledLotteries.length + trashedLotteries.length > 0 ? (
            <LotteryGrid lotteries={[...cancelledLotteries, ...trashedLotteries]} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">No cancelled or trashed lotteries</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
