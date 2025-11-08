"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Ticket, TrendingUp, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~~/components/ui/avatar";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "~~/components/ui/card";
import { Progress } from "~~/components/ui/progress";
import { LOTTERY_STATE_COLORS, LOTTERY_STATE_LABELS, LotteryState } from "~~/lib/constants";
import { calculatePercentage, formatAddress, formatEth, formatTimeRemaining } from "~~/lib/utils";
import type { Lottery } from "~~/types/lottery";

interface LotteryCardProps {
  lottery: Lottery;
  onBuyClick?: (lotteryId: number) => void;
  compact?: boolean;
}

/**
 * LotteryCard - Displays a lottery in a card format
 * Shows NFT image, price, progress, and key stats
 */
export function LotteryCard({ lottery, onBuyClick, compact = false }: LotteryCardProps) {
  const [imageError, setImageError] = useState(false);

  const progressPercentage = calculatePercentage(lottery.wonkaBarsSold, lottery.wonkaBarsMaxSupply);
  const isActive = lottery.state === LotteryState.ACTIVE;
  const isEndingSoon = isActive && lottery.expirationDate.getTime() - Date.now() < 24 * 60 * 60 * 1000; // < 24h
  const isSoldOut = lottery.wonkaBarsSold >= lottery.wonkaBarsMaxSupply;

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onBuyClick && isActive && !isSoldOut) {
      onBuyClick(lottery.id);
    }
  };

  return (
    <Link href={`/lotteries/${lottery.id}`} className="block group">
      <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
        {/* NFT Image */}
        <div className="relative aspect-square bg-muted">
          {!imageError ? (
            <Image
              src={lottery.nftImageUrl || "/placeholder-nft.png"}
              alt={lottery.nftName}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted">
              <Ticket className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <Badge className={LOTTERY_STATE_COLORS[lottery.state]}>{LOTTERY_STATE_LABELS[lottery.state]}</Badge>
          </div>

          {/* Ending Soon Badge */}
          {isEndingSoon && (
            <div className="absolute top-2 left-2">
              <Badge variant="destructive" className="animate-pulse">
                Ending Soon
              </Badge>
            </div>
          )}

          {/* Sold Out Overlay */}
          {isSoldOut && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Sold Out
              </Badge>
            </div>
          )}
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{lottery.nftName}</h3>
              <p className="text-sm text-muted-foreground truncate">{formatAddress(lottery.nftContract)}</p>
            </div>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={`https://effigy.im/a/${lottery.owner}.png`} />
              <AvatarFallback>{lottery.owner.slice(2, 4)}</AvatarFallback>
            </Avatar>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-3">
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {lottery.wonkaBarsSold} / {lottery.wonkaBarsMaxSupply}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Stats Grid */}
          {!compact && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Ticket className="h-4 w-4" />
                <span>{formatEth(lottery.wonkaBarPrice)} XRP</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>{formatEth(lottery.totalRaised)} XRP</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatTimeRemaining(lottery.expirationDate)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{progressPercentage.toFixed(0)}% sold</span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          {isActive && !isSoldOut ? (
            <Button className="w-full" onClick={handleBuyClick} variant="default">
              Buy WonkaBar
            </Button>
          ) : (
            <Button className="w-full" variant="secondary" disabled>
              {isSoldOut ? "Sold Out" : LOTTERY_STATE_LABELS[lottery.state]}
            </Button>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
