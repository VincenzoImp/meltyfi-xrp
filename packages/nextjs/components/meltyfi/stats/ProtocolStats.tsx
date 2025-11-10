"use client";

import { Activity, Ticket, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/card";
import { useLotteries } from "~~/hooks/meltyfi";
import { formatNumber } from "~~/lib/utils";

/**
 * ProtocolStats - Displays overall protocol statistics
 */
export function ProtocolStats() {
  const { totalLotteries, activeLotteries, isLoading, error } = useLotteries();

  if (error) {
    return (
      <Card className="col-span-full">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">Unable to load protocol stats: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

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
      value: isLoading ? "..." : "0 XRP", // TODO: Implement total volume tracking
      icon: TrendingUp,
      description: "Total XRP transacted",
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
