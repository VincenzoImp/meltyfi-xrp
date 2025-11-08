"use client";

import { Activity, Ticket, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/card";
import { useLotteries } from "~~/hooks/meltyfi";
import { formatNumber } from "~~/lib/utils";

/**
 * ProtocolStats - Displays overall protocol statistics
 */
export function ProtocolStats() {
  const { totalLotteries, activeLotteries, isLoading } = useLotteries();

  const stats = [
    {
      title: "Total Lotteries",
      value: isLoading ? "..." : formatNumber(totalLotteries),
      icon: Ticket,
      description: "All-time lotteries created",
    },
    {
      title: "Active Lotteries",
      value: isLoading ? "..." : formatNumber(activeLotteries),
      icon: Activity,
      description: "Currently accepting entries",
    },
    {
      title: "Total Volume",
      value: isLoading ? "..." : "0 ETH", // TODO: Implement total volume tracking
      icon: TrendingUp,
      description: "Total ETH transacted",
    },
    {
      title: "Participants",
      value: isLoading ? "..." : "0", // TODO: Implement participant tracking
      icon: Users,
      description: "Unique wallet addresses",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
