"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Image as ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { useAccount } from "wagmi";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { Card, CardContent } from "~~/components/ui/card";
import { type NFT, useUserNFTs } from "~~/hooks/meltyfi";

interface NFTSelectorProps {
  selectedNFT: NFT | null;
  onSelect: (nft: NFT) => void;
}

/**
 * NFTSelector - Gallery view for selecting NFTs from user's wallet
 */
export function NFTSelector({ selectedNFT, onSelect }: NFTSelectorProps) {
  const { address } = useAccount();
  const { nfts, isLoading, error, refetch } = useUserNFTs(address as `0x${string}` | undefined);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (nftKey: string) => {
    setImageErrors(prev => new Set([...prev, nftKey]));
  };

  const isSelected = (nft: NFT) => {
    if (!selectedNFT) return false;
    return selectedNFT.contract === nft.contract && selectedNFT.tokenId === nft.tokenId;
  };

  if (!address) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Connect your wallet to view your NFTs</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading your NFT collection...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-sm text-destructive mb-4">Error loading NFTs: {error.message}</p>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (nfts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-2">No NFTs found in your wallet</p>
            <p className="text-xs text-muted-foreground">Make sure you own NFTs on this network or try refreshing</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={refetch}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Your NFTs</h3>
          <p className="text-sm text-muted-foreground">
            {nfts.length} NFT{nfts.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* NFT Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {nfts.map(nft => {
          const nftKey = `${nft.contract}-${nft.tokenId}`;
          const hasImageError = imageErrors.has(nftKey);
          const selected = isSelected(nft);

          return (
            <Card
              key={nftKey}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selected ? "ring-2 ring-primary shadow-lg" : ""
              }`}
              onClick={() => onSelect(nft)}
            >
              <CardContent className="p-0">
                {/* NFT Image */}
                <div className="relative aspect-square bg-muted">
                  {!hasImageError ? (
                    <Image
                      src={nft.image}
                      alt={nft.name}
                      fill
                      className="object-cover rounded-t-lg"
                      onError={() => handleImageError(nftKey)}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Selected Badge */}
                  {selected && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-primary">
                        <Check className="h-3 w-3" />
                      </Badge>
                    </div>
                  )}
                </div>

                {/* NFT Info */}
                <div className="p-3">
                  <p className="font-medium text-sm truncate">{nft.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{nft.collectionName}</p>
                  <p className="text-xs text-muted-foreground mt-1">Token #{nft.tokenId}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected NFT Info */}
      {selectedNFT && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Selected: {selectedNFT.name}</p>
                <p className="text-xs text-muted-foreground">
                  Contract: {selectedNFT.contract.slice(0, 6)}...{selectedNFT.contract.slice(-4)} • Token #
                  {selectedNFT.tokenId}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
