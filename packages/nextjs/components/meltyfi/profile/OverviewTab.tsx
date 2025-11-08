"use client";

import Link from "next/link";
import { Activity, Clock, Ticket, TrendingUp, Trophy, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/card";
import { useChocoChip } from "~~/hooks/meltyfi";
import { formatNumber } from "~~/lib/utils";

interface OverviewTabProps {
  address: `0x${string}`;
  isOwnProfile: boolean;
}

/**
 * OverviewTab - Shows user statistics and recent activity
 */
export function OverviewTab({ address, isOwnProfile }: OverviewTabProps) {
  const { balance: chocoChipBalance, isLoading } = useChocoChip(address);

  // TODO: Fetch real data from contracts/The Graph
  const stats = [
    {
      title: "Total Lotteries Created",
      value: "0",
      icon: Ticket,
      description: "NFTs listed in lotteries",
      change: null,
    },
    {
      title: "Active Lotteries",
      value: "0",
      icon: Activity,
      description: "Currently accepting entries",
      change: null,
    },
    {
      title: "Total Wagered",
      value: "0 XRP",
      icon: TrendingUp,
      description: "Lifetime XRP spent on tickets",
      change: null,
    },
    {
      title: "Lotteries Won",
      value: "0",
      icon: Trophy,
      description: "NFTs won from lotteries",
      change: null,
    },
    {
      title: "ChocoChips Balance",
      value: isLoading ? "..." : formatNumber(chocoChipBalance),
      icon: Wallet,
      description: "Loyalty tokens earned",
      change: null,
    },
    {
      title: "Active Tickets",
      value: "0",
      icon: Clock,
      description: "Tickets in active lotteries",
      change: null,
    },
  ];

  // TODO: Fetch recent activity from The Graph
  const recentActivity = [
    // { type: "lottery_created", data: {...}, timestamp: ... },
    // { type: "ticket_purchased", data: {...}, timestamp: ... },
    // { type: "lottery_won", data: {...}, timestamp: ... },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                {stat.change && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {stat.change > 0 ? "+" : ""}
                    {stat.change}% from last month
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            {isOwnProfile ? "Your recent activity on MeltyFi" : "Recent activity for this address"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No recent activity</p>
              {isOwnProfile && (
                <Link href="/lotteries">
                  <p className="text-sm text-primary hover:underline mt-2">Browse active lotteries</p>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* TODO: Map recent activity items */}
              <p className="text-sm text-muted-foreground">Activity feed coming soon...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
