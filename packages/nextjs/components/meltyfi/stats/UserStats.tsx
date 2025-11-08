"use client";

import { Ticket, TrendingUp, Trophy, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { Badge } from "~~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/card";
import { useChocoChip } from "~~/hooks/meltyfi";
import { formatNumber } from "~~/lib/utils";

/**
 * UserStats - Displays user-specific statistics
 */
export function UserStats() {
  const { address } = useAccount();
  const { balance: chocoChipBalance, isLoading } = useChocoChip(address as `0x${string}` | undefined);

  if (!address) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Connect your wallet to view stats</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      title: "CHOC Balance",
      value: isLoading ? "..." : formatNumber(chocoChipBalance),
      icon: Trophy,
      description: "ChocoChip tokens earned",
      badge: chocoChipBalance > 0n ? "Active" : null,
    },
    {
      title: "Active Tickets",
      value: "0", // TODO: Implement active tickets count
      icon: Ticket,
      description: "Tickets in active lotteries",
    },
    {
      title: "Lotteries Created",
      value: "0", // TODO: Implement lotteries created count
      icon: TrendingUp,
      description: "Total lotteries you've created",
    },
    {
      title: "Total Wagered",
      value: "0 XRP", // TODO: Implement total wagered tracking
      icon: Wallet,
      description: "Lifetime XRP spent on tickets",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                {stat.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {stat.badge}
                  </Badge>
                )}
              </div>
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
