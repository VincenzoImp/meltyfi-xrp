"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BuyWonkaBarsDialog } from "./BuyWonkaBarsDialog";
import { ClaimNFTDialog } from "./ClaimNFTDialog";
import { MeltWonkaBarsDialog } from "./MeltWonkaBarsDialog";
import { RepayLoanDialog } from "./RepayLoanDialog";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Flame,
  RefreshCw,
  Target,
  Ticket,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { Avatar, AvatarFallback, AvatarImage } from "~~/components/ui/avatar";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/card";
import { Progress } from "~~/components/ui/progress";
import { useWonkaBar } from "~~/hooks/meltyfi";
import { LOTTERY_STATE_COLORS, LOTTERY_STATE_LABELS, LotteryState } from "~~/lib/constants";
import { calculatePercentage, copyToClipboard, formatAddress, formatEth, formatTimeRemaining } from "~~/lib/utils";
import type { Lottery } from "~~/types/lottery";

interface LotteryDetailsProps {
  lottery: Lottery;
}

/**
 * LotteryDetails - Full details view for a lottery
 */
export function LotteryDetails({ lottery }: LotteryDetailsProps) {
  const { address } = useAccount();
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [repayDialogOpen, setRepayDialogOpen] = useState(false);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [meltDialogOpen, setMeltDialogOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);
  const { balance: userBalance } = useWonkaBar(address as `0x${string}` | undefined, lottery.id);

  const progressPercentage = calculatePercentage(lottery.wonkaBarsSold, lottery.wonkaBarsMaxSupply);
  const isActive = lottery.state === LotteryState.ACTIVE;
  const isCancelled = lottery.state === LotteryState.CANCELLED;
  const isCompleted = lottery.state === LotteryState.COMPLETED;
  const isSoldOut = lottery.wonkaBarsSold >= lottery.wonkaBarsMaxSupply;
  const isOwner = address && address.toLowerCase() === lottery.owner.toLowerCase();
  const isWinner = address && lottery.winner && address.toLowerCase() === lottery.winner.toLowerCase();
  const userWinProbability =
    Number(userBalance) > 0 ? calculatePercentage(Number(userBalance), lottery.wonkaBarsMaxSupply) : 0;

  const handleCopyAddress = async (addr: string) => {
    const success = await copyToClipboard(addr);
    if (success) {
      setCopied(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - NFT Image and Basic Info */}
        <div className="space-y-4">
          {/* NFT Image */}
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-muted">
              {!imageError ? (
                <Image
                  src={lottery.nftImageUrl || "/placeholder-nft.png"}
                  alt={lottery.nftName}
                  fill
                  className="object-cover"
                  priority
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-muted">
                  <Ticket className="h-24 w-24 text-muted-foreground" />
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <Badge className={LOTTERY_STATE_COLORS[lottery.state]}>{LOTTERY_STATE_LABELS[lottery.state]}</Badge>
              </div>
            </div>
          </Card>

          {/* NFT Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">NFT Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Contract</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded">{formatAddress(lottery.nftContract, 6)}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleCopyAddress(lottery.nftContract)}
                  >
                    {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Token ID</span>
                <span className="text-sm font-medium">#{lottery.nftTokenId.toString()}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Owner</span>
                <Link href={`/profile/${lottery.owner}`} className="flex items-center gap-2 hover:underline">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={`https://effigy.im/a/${lottery.owner}.png`} />
                    <AvatarFallback>{lottery.owner.slice(2, 4)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{formatAddress(lottery.owner)}</span>
                  {isOwner && (
                    <Badge variant="secondary" className="text-xs">
                      You
                    </Badge>
                  )}
                </Link>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <a
                  href={`https://testnets.opensea.io/assets/${lottery.nftContract}/${lottery.nftTokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on OpenSea
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Lottery Details */}
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{lottery.nftName}</h1>
            <p className="text-muted-foreground">
              Lottery #{lottery.id} • Created{" "}
              {formatTimeRemaining(new Date(lottery.expirationDate.getTime() - 7 * 24 * 60 * 60 * 1000))} ago
            </p>
          </div>

          {/* Purchase Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Purchase Tickets</span>
                <span className="text-2xl font-bold">{formatEth(lottery.wonkaBarPrice)} ETH</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sold</span>
                  <span className="font-medium">
                    {lottery.wonkaBarsSold} / {lottery.wonkaBarsMaxSupply}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-xs text-muted-foreground text-center">{progressPercentage.toFixed(1)}% sold</p>
              </div>

              {/* User's Holdings */}
              {Number(userBalance) > 0 && (
                <div className="p-3 bg-primary/10 rounded-lg space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    Your Tickets: {userBalance.toString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Win probability: {userWinProbability.toFixed(2)}%</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {/* Buy WonkaBars */}
                {isActive && !isSoldOut ? (
                  <Button className="w-full" size="lg" onClick={() => setBuyDialogOpen(true)} disabled={!address}>
                    <Ticket className="mr-2 h-5 w-5" />
                    Buy WonkaBars
                  </Button>
                ) : isActive && isSoldOut ? (
                  <Button className="w-full" size="lg" variant="secondary" disabled>
                    Sold Out
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" variant="secondary" disabled>
                    {LOTTERY_STATE_LABELS[lottery.state]}
                  </Button>
                )}

                {/* Owner: Repay Loan (Cancel Lottery) */}
                {isOwner && isActive && lottery.wonkaBarsSold > 0 && (
                  <Button
                    className="w-full"
                    size="lg"
                    variant="destructive"
                    onClick={() => setRepayDialogOpen(true)}
                    disabled={!address}
                  >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Cancel Lottery & Refund
                  </Button>
                )}

                {/* Winner: Claim NFT */}
                {isWinner && isCompleted && (
                  <Button
                    className="w-full bg-yellow-500 hover:bg-yellow-600"
                    size="lg"
                    onClick={() => setClaimDialogOpen(true)}
                    disabled={!address}
                  >
                    <Trophy className="mr-2 h-5 w-5" />
                    Claim Your NFT
                  </Button>
                )}

                {/* Participant: Melt WonkaBars */}
                {isCancelled && Number(userBalance) > 0 && (
                  <Button
                    className="w-full"
                    size="lg"
                    variant="outline"
                    onClick={() => setMeltDialogOpen(true)}
                    disabled={!address}
                  >
                    <Flame className="mr-2 h-5 w-5" />
                    Melt WonkaBars for Refund
                  </Button>
                )}

                {!address && (
                  <p className="text-xs text-center text-muted-foreground">Connect your wallet to interact</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Raised</p>
                    <p className="text-lg font-bold">{formatEth(lottery.totalRaised)} ETH</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time Remaining</p>
                    <p className="text-lg font-bold">{formatTimeRemaining(lottery.expirationDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Participants</p>
                    <p className="text-lg font-bold">{lottery.wonkaBarsSold}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Max Supply</p>
                    <p className="text-lg font-bold">{lottery.wonkaBarsMaxSupply}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Winner Card (if completed) */}
          {lottery.state === LotteryState.COMPLETED && lottery.winner && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Trophy className="h-5 w-5" />
                  Winner Announced
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/profile/${lottery.winner}`}
                  className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://effigy.im/a/${lottery.winner}.png`} />
                    <AvatarFallback>{lottery.winner.slice(2, 4)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{formatAddress(lottery.winner)}</p>
                    <p className="text-xs text-muted-foreground">Click to view profile</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Lottery Created</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(lottery.expirationDate.getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {isActive && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Currently Active</p>
                    <p className="text-xs text-muted-foreground">Ends {lottery.expirationDate.toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              {lottery.state === LotteryState.COMPLETED && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Winner Selected</p>
                    <p className="text-xs text-muted-foreground">{lottery.expirationDate.toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <BuyWonkaBarsDialog lottery={lottery} open={buyDialogOpen} onOpenChange={setBuyDialogOpen} />
      <RepayLoanDialog lottery={lottery} open={repayDialogOpen} onOpenChange={setRepayDialogOpen} />
      <ClaimNFTDialog lottery={lottery} open={claimDialogOpen} onOpenChange={setClaimDialogOpen} />
      <MeltWonkaBarsDialog lottery={lottery} open={meltDialogOpen} onOpenChange={setMeltDialogOpen} />
    </>
  );
}
