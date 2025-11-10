"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Calendar, CheckCircle2, Ticket, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { NFTSelector } from "~~/components/meltyfi";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/card";
import { Input } from "~~/components/ui/input";
import { Label } from "~~/components/ui/label";
import { Separator } from "~~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~~/components/ui/tabs";
import { type NFT, useCreateLottery } from "~~/hooks/meltyfi";
import {
  BASIS_POINTS,
  ERROR_MESSAGES,
  MAX_DURATION_DAYS,
  MAX_WONKA_BARS_PER_LOTTERY,
  MIN_DURATION_DAYS,
  MIN_WONKA_BARS_PER_LOTTERY,
  PROTOCOL_FEE_PERCENTAGE,
} from "~~/lib/constants";
import { formatXrp, parseXrpToWei } from "~~/lib/utils";
import type { CreateLotteryFormData } from "~~/types/lottery";

/**
 * CreateLotteryForm - Multi-step form for creating a new lottery
 */
export function CreateLotteryForm() {
  const router = useRouter();
  const { address } = useAccount();
  const { createLottery, isPending, isSuccess, error: createError, canTransact } = useCreateLottery();

  const [formData, setFormData] = useState<CreateLotteryFormData>({
    nftContract: "" as `0x${string}`,
    nftTokenId: 0n,
    nftName: "",
    nftImageUrl: "",
    wonkaBarPrice: "",
    wonkaBarsMaxSupply: 10,
    durationInDays: 7,
  });

  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateLotteryFormData, string>>>({});

  // Handle NFT selection from gallery
  const handleNFTSelect = (nft: NFT) => {
    setSelectedNFT(nft);
    setFormData({
      ...formData,
      nftContract: nft.contract as `0x${string}`,
      nftTokenId: BigInt(nft.tokenId),
      nftName: nft.name,
      nftImageUrl: nft.image,
    });
  };

  // Calculate estimates
  const priceInWei = formData.wonkaBarPrice ? parseXrpToWei(formData.wonkaBarPrice) : 0n;
  const totalPotential = priceInWei * BigInt(formData.wonkaBarsMaxSupply);
  const protocolFee = (totalPotential * BigInt(PROTOCOL_FEE_PERCENTAGE)) / BigInt(BASIS_POINTS);
  const ownerProceeds = totalPotential - protocolFee;

  // Calculate expiration date (memoized to prevent hydration issues)
  const expirationDate = useMemo(() => {
    const date = new Date(Date.now() + formData.durationInDays * 24 * 60 * 60 * 1000);
    // Use ISO string and format consistently on both client and server
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }, [formData.durationInDays]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateLotteryFormData, string>> = {};

    // NFT Contract validation
    if (!formData.nftContract || !formData.nftContract.match(/^0x[a-fA-F0-9]{40}$/)) {
      newErrors.nftContract = "Invalid contract address";
    }

    // NFT Name validation
    if (!formData.nftName.trim()) {
      newErrors.nftName = "NFT name is required";
    }

    // Price validation
    if (!formData.wonkaBarPrice || parseFloat(formData.wonkaBarPrice) <= 0) {
      newErrors.wonkaBarPrice = "Price must be greater than 0";
    }

    // Max supply validation
    if (
      formData.wonkaBarsMaxSupply < MIN_WONKA_BARS_PER_LOTTERY ||
      formData.wonkaBarsMaxSupply > MAX_WONKA_BARS_PER_LOTTERY
    ) {
      newErrors.wonkaBarsMaxSupply = `Must be between ${MIN_WONKA_BARS_PER_LOTTERY} and ${MAX_WONKA_BARS_PER_LOTTERY}`;
    }

    // Duration validation
    if (formData.durationInDays < MIN_DURATION_DAYS || formData.durationInDays > MAX_DURATION_DAYS) {
      newErrors.durationInDays = `Must be between ${MIN_DURATION_DAYS} and ${MAX_DURATION_DAYS} days`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      toast.error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      return;
    }

    if (!validateForm()) {
      toast.error(ERROR_MESSAGES.INVALID_INPUT);
      return;
    }

    await createLottery(formData);
  };

  // Redirect on success
  if (isSuccess) {
    setTimeout(() => {
      router.push("/lotteries");
    }, 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* NFT Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select NFT</CardTitle>
          <CardDescription>Choose an NFT from your wallet or enter details manually</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="browse" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="browse">Browse My NFTs</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>

            {/* Browse NFTs Tab */}
            <TabsContent value="browse" className="mt-4">
              <NFTSelector selectedNFT={selectedNFT} onSelect={handleNFTSelect} />
            </TabsContent>

            {/* Manual Entry Tab */}
            <TabsContent value="manual" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nftContract">NFT Contract Address *</Label>
                <Input
                  id="nftContract"
                  placeholder="0x..."
                  value={formData.nftContract}
                  onChange={e => setFormData({ ...formData, nftContract: e.target.value as `0x${string}` })}
                  className={errors.nftContract ? "border-destructive" : ""}
                />
                {errors.nftContract && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.nftContract}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nftTokenId">Token ID *</Label>
                <Input
                  id="nftTokenId"
                  type="number"
                  placeholder="0"
                  value={formData.nftTokenId.toString()}
                  onChange={e => setFormData({ ...formData, nftTokenId: BigInt(e.target.value || 0) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nftName">NFT Name *</Label>
                <Input
                  id="nftName"
                  placeholder="My Cool NFT"
                  value={formData.nftName}
                  onChange={e => setFormData({ ...formData, nftName: e.target.value })}
                  className={errors.nftName ? "border-destructive" : ""}
                />
                {errors.nftName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.nftName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nftImageUrl">NFT Image URL (optional)</Label>
                <Input
                  id="nftImageUrl"
                  type="url"
                  placeholder="https://..."
                  value={formData.nftImageUrl}
                  onChange={e => setFormData({ ...formData, nftImageUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  If not provided, we&apos;ll attempt to fetch it from the contract
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Lottery Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Lottery Parameters</CardTitle>
          <CardDescription>Configure the price, supply, and duration of your lottery</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wonkaBarPrice">Ticket Price (XRP) *</Label>
            <Input
              id="wonkaBarPrice"
              type="number"
              step="0.001"
              placeholder="0.1"
              value={formData.wonkaBarPrice}
              onChange={e => setFormData({ ...formData, wonkaBarPrice: e.target.value })}
              className={errors.wonkaBarPrice ? "border-destructive" : ""}
            />
            {errors.wonkaBarPrice && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.wonkaBarPrice}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="wonkaBarsMaxSupply">Max Tickets *</Label>
            <Input
              id="wonkaBarsMaxSupply"
              type="number"
              min={MIN_WONKA_BARS_PER_LOTTERY}
              max={MAX_WONKA_BARS_PER_LOTTERY}
              value={formData.wonkaBarsMaxSupply}
              onChange={e => setFormData({ ...formData, wonkaBarsMaxSupply: parseInt(e.target.value) })}
              className={errors.wonkaBarsMaxSupply ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Between {MIN_WONKA_BARS_PER_LOTTERY} and {MAX_WONKA_BARS_PER_LOTTERY} tickets
            </p>
            {errors.wonkaBarsMaxSupply && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.wonkaBarsMaxSupply}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationInDays">Duration (Days) *</Label>
            <Input
              id="durationInDays"
              type="number"
              min={MIN_DURATION_DAYS}
              max={MAX_DURATION_DAYS}
              value={formData.durationInDays}
              onChange={e => setFormData({ ...formData, durationInDays: parseInt(e.target.value) })}
              className={errors.durationInDays ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Between {MIN_DURATION_DAYS} and {MAX_DURATION_DAYS} days
            </p>
            {errors.durationInDays && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.durationInDays}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Review your lottery configuration before creating</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Potential</p>
                <p className="font-bold">{formatXrp(totalPotential)} XRP</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">You Receive</p>
                <p className="font-bold">{formatXrp(ownerProceeds)} XRP</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Ticket className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Protocol Fee (5%)</p>
                <p className="font-bold">{formatXrp(protocolFee)} XRP</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ticket Price:</span>
              <span className="font-medium">{formData.wonkaBarPrice || "0"} XRP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Tickets:</span>
              <span className="font-medium">{formData.wonkaBarsMaxSupply}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{formData.durationInDays} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Expiration:</span>
              <Badge variant="secondary">
                <Calendar className="mr-1 h-3 w-3" />
                {expirationDate}
              </Badge>
            </div>
          </div>

          {!address && (
            <div className="p-3 bg-destructive/10 rounded-lg">
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {ERROR_MESSAGES.WALLET_NOT_CONNECTED}
              </p>
            </div>
          )}

          {!canTransact && (
            <div className="p-3 bg-destructive/10 rounded-lg">
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Contract not available on this network. Switch to a supported network to create a lottery.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.push("/lotteries")}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={!address || isPending || isSuccess || !canTransact}>
          {isPending ? "Creating..." : isSuccess ? "Created!" : canTransact ? "Create Lottery" : "Unavailable"}
        </Button>
      </div>

      {createError && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-xs flex gap-2 items-start">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <p>{createError.message}</p>
        </div>
      )}
    </form>
  );
}
