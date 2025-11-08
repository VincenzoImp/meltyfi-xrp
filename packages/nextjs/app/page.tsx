"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Ticket } from "lucide-react";
import type { NextPage } from "next";
import { LotteryGrid, ProtocolStats, UserStats } from "~~/components/meltyfi";
import { Button } from "~~/components/ui/button";
import { useLotteries, useLottery } from "~~/hooks/meltyfi";

const Home: NextPage = () => {
  const { lotteryIds, isLoading } = useLotteries();

  // Get the first few active lotteries for the homepage
  const featuredLotteryIds = lotteryIds.slice(0, 4);

  // Fetch featured lotteries
  const featuredLotteries = featuredLotteryIds
    .map(id => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { lottery } = useLottery(Number(id));
      return lottery;
    })
    .filter((lottery): lottery is NonNullable<typeof lottery> => lottery !== null);

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">NFT Liquidity Protocol</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          Unlock Your NFT&apos;s
          <span className="block text-primary mt-2">Liquidity Potential</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Create lotteries for your NFTs and receive XRP as tickets are sold. Participants buy tickets for a chance to
          win, and you keep 95% of the proceeds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button size="lg" asChild className="text-lg">
            <Link href="/create">
              <Ticket className="mr-2 h-5 w-5" />
              Create Lottery
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-lg">
            <Link href="/lotteries">
              Browse Lotteries
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Protocol Stats */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Protocol Overview</h2>
        <ProtocolStats />
      </section>

      {/* User Stats */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Your Dashboard</h2>
        <UserStats />
      </section>

      {/* Featured Lotteries */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Active Lotteries</h2>
          <Button variant="ghost" asChild>
            <Link href="/lotteries">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : featuredLotteries.length > 0 ? (
          <LotteryGrid lotteries={featuredLotteries} />
        ) : (
          <div className="text-center py-12 bg-muted rounded-lg">
            <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Active Lotteries</h3>
            <p className="text-muted-foreground mb-4">Be the first to create a lottery!</p>
            <Button asChild>
              <Link href="/create">Create Lottery</Link>
            </Button>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-xl font-semibold">Create Lottery</h3>
            <p className="text-muted-foreground">
              Lock your NFT and set the ticket price. Choose how many tickets to sell and the duration.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 className="text-xl font-semibold">Earn as Tickets Sell</h3>
            <p className="text-muted-foreground">
              As participants buy tickets, you receive 95% of the XRP. Withdraw proceeds anytime during the lottery.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 className="text-xl font-semibold">Winner Selected</h3>
            <p className="text-muted-foreground">
              When the lottery ends or sells out, a random winner is selected via Chainlink VRF.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 rounded-2xl p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join the MeltyFi protocol and unlock liquidity for your NFTs. Earn XRP as tickets sell with no risk of
          liquidation.
        </p>
        <Button size="lg" asChild>
          <Link href="/create">
            Create Your First Lottery
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </section>
    </div>
  );
};

export default Home;
