"use client";

import { useEffect, useState } from "react";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import type { NextPage } from "next";
import { useChainId, useReadContracts } from "wagmi";
import { BuyWonkaBarsDialog, LotteryGrid } from "~~/components/meltyfi";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { Input } from "~~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~~/components/ui/select";
import { useLotteries } from "~~/hooks/meltyfi";
import { LotteryState } from "~~/lib/constants";
import { ABIS, getContractsByChainId } from "~~/lib/contracts";
import type { Lottery } from "~~/types/lottery";

const LotteriesPage: NextPage = () => {
  const chainId = useChainId();
  const contracts = getContractsByChainId(chainId);

  const { lotteryIds, isLoading, error: lotteriesError } = useLotteries();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterState, setFilterState] = useState("all");
  const [selectedLottery, setSelectedLottery] = useState<Lottery | null>(null);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);

  // Fetch all lotteries using useReadContracts (batch call)
  const lotteryContracts = lotteryIds.map(id => ({
    address: contracts.MeltyFiProtocol,
    abi: ABIS.MeltyFiProtocol as any,
    functionName: "getLottery" as const,
    args: [id] as const,
  }));

  const { data: lotteriesData, isLoading: isLoadingLotteries, error: contractsError } = useReadContracts({
    contracts: lotteryContracts as any,
  });

  // Transform contract data to Lottery type
  const [lotteries, setLotteries] = useState<Lottery[]>([]);

  useEffect(() => {
    if (lotteriesData) {
      const transformedLotteries = lotteriesData
        .map((result, index) => {
          if (result.status === "success" && result.result) {
            const data = result.result as any;
            return {
              id: Number(lotteryIds[index]),
              owner: data.owner,
              nftContract: data.nftContract,
              nftTokenId: data.nftTokenId,
              nftName: data.nftName,
              nftImageUrl: data.nftImageUrl,
              wonkaBarPrice: data.wonkaBarPrice,
              wonkaBarsMaxSupply: Number(data.wonkaBarsMaxSupply),
              wonkaBarsSold: Number(data.wonkaBarsSold),
              totalRaised: data.totalRaised,
              state: Number(data.state) as LotteryState,
              expirationDate: new Date(Number(data.expirationDate) * 1000),
              winner: data.winner !== "0x0000000000000000000000000000000000000000" ? data.winner : undefined,
            } as Lottery;
          }
          return null;
        })
        .filter((lottery): lottery is Lottery => lottery !== null);

      setLotteries(transformedLotteries);
    }
  }, [lotteriesData, lotteryIds]);

  // Filter lotteries
  const filteredLotteries = lotteries.filter(lottery => {
    // Search filter
    if (searchQuery && !lottery.nftName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // State filter
    if (filterState === "active" && lottery.state !== 0) return false;
    if (filterState === "ending-soon") {
      const timeLeft = lottery.expirationDate.getTime() - Date.now();
      if (timeLeft > 24 * 60 * 60 * 1000 || lottery.state !== 0) return false;
    }
    if (filterState === "sold-out" && lottery.wonkaBarsSold < lottery.wonkaBarsMaxSupply) {
      return false;
    }

    return true;
  });

  // Sort lotteries
  const sortedLotteries = [...filteredLotteries].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return b.id - a.id;
      case "ending-soon":
        return a.expirationDate.getTime() - b.expirationDate.getTime();
      case "price-low":
        return Number(a.wonkaBarPrice - b.wonkaBarPrice);
      case "price-high":
        return Number(b.wonkaBarPrice - a.wonkaBarPrice);
      case "popularity":
        return b.wonkaBarsSold - a.wonkaBarsSold;
      default:
        return 0;
    }
  });

  const handleBuyClick = (lotteryId: number) => {
    const lottery = lotteries.find(l => l.id === lotteryId);
    if (lottery) {
      setSelectedLottery(lottery);
      setBuyDialogOpen(true);
    }
  };

  const pageError = lotteriesError || contractsError;

  if (pageError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Browse Lotteries</h1>
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
          <p className="font-semibold mb-1">Unable to load lotteries.</p>
          <p>{pageError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Lotteries</h1>
          <p className="text-muted-foreground">Discover and participate in active NFT lotteries</p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by NFT name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* State Filter */}
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lotteries</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="ending-soon">Ending Soon</SelectItem>
                <SelectItem value="sold-out">Sold Out</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="ending-soon">Ending Soon</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="popularity">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">
              {sortedLotteries.length} {sortedLotteries.length === 1 ? "lottery" : "lotteries"} found
            </span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchQuery}
                <button onClick={() => setSearchQuery("")} className="ml-1 hover:bg-muted-foreground/20 rounded-full">
                  ×
                </button>
              </Badge>
            )}
            {filterState !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {filterState === "active" && "Active"}
                {filterState === "ending-soon" && "Ending Soon"}
                {filterState === "sold-out" && "Sold Out"}
                <button
                  onClick={() => setFilterState("all")}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full"
                >
                  ×
                </button>
              </Badge>
            )}
            {(searchQuery || filterState !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilterState("all");
                }}
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Lottery Grid */}
        <LotteryGrid
          lotteries={sortedLotteries}
          isLoading={isLoading || isLoadingLotteries}
          onBuyClick={handleBuyClick}
          emptyMessage={searchQuery || filterState !== "all" ? "No lotteries match your filters" : "No lotteries found"}
        />
      </div>

      {/* Buy Dialog */}
      <BuyWonkaBarsDialog lottery={selectedLottery} open={buyDialogOpen} onOpenChange={setBuyDialogOpen} />
    </>
  );
};

export default LotteriesPage;
