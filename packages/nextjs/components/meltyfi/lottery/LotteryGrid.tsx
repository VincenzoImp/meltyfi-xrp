"use client";

import { LotteryCard } from "./LotteryCard";
import type { Lottery } from "~~/types/lottery";

interface LotteryGridProps {
  lotteries: Lottery[];
  isLoading?: boolean;
  onBuyClick?: (lotteryId: number) => void;
  emptyMessage?: string;
}

/**
 * LotteryGrid - Displays a responsive grid of lottery cards
 */
export function LotteryGrid({
  lotteries,
  isLoading,
  onBuyClick,
  emptyMessage = "No lotteries found",
}: LotteryGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (lotteries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {lotteries.map(lottery => (
        <LotteryCard key={lottery.id} lottery={lottery} onBuyClick={onBuyClick} />
      ))}
    </div>
  );
}
