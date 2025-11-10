"use client";

import { useEffect, useState } from "react";
import { Gift, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Button } from "~~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/card";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { ABIS, getContractsByChainId } from "~~/lib/contracts";

/**
 * Free Mint Page - Allows users to mint test NFTs for free
 */
export default function FreeMintPage() {
  const { address, isConnected } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const [mintedTokenId, setMintedTokenId] = useState<bigint | null>(null);

  const testNFTAddress = getContractsByChainId(targetNetwork.id).TestNFT;

  const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleMint = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!testNFTAddress || testNFTAddress === "0x0000000000000000000000000000000000000000") {
      toast.error("TestNFT contract not deployed on this network");
      return;
    }

    try {
      writeContract(
        {
          address: testNFTAddress,
          abi: ABIS.TestNFT,
          functionName: "mint",
        },
        {
          onSuccess: () => {
            toast.success("Minting your NFT...");
          },
          onError: error => {
            toast.error(`Failed to mint: ${error.message}`);
          },
        },
      );
    } catch {
      toast.error("Failed to mint NFT");
    }
  };

  // Handle successful mint
  useEffect(() => {
    if (isSuccess && !mintedTokenId) {
      toast.success("NFT minted successfully! 🎉");
      // You could parse the transaction receipt to get the token ID here
      setMintedTokenId(BigInt(0)); // Placeholder
    }
  }, [isSuccess, mintedTokenId]);

  const isPending = isWritePending || isConfirming;

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Gift className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">Free NFT Mint</h1>
        </div>
        <p className="text-xl text-muted-foreground">Mint free test NFTs to use in MeltyFi lotteries</p>
      </div>

      <div className="grid gap-6">
        {/* Main Mint Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Mint Your NFT
            </CardTitle>
            <CardDescription>
              Get a free MeltyFi Test NFT that you can use to create lotteries or participate in the ecosystem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Connect your wallet to mint NFTs</p>
              </div>
            ) : (
              <>
                {/* NFT Preview */}
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Gift className="h-24 w-24 mx-auto text-primary mb-4" />
                    <p className="text-lg font-semibold">MeltyFi Test NFT</p>
                    <p className="text-sm text-muted-foreground">Collection: MeltyFi Test NFTs</p>
                  </div>
                </div>

                {/* Mint Button */}
                <Button onClick={handleMint} disabled={isPending} size="lg" className="w-full">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {isWritePending ? "Confirming..." : "Minting..."}
                    </>
                  ) : (
                    <>
                      <Gift className="mr-2 h-5 w-5" />
                      Mint Free NFT
                    </>
                  )}
                </Button>

                {writeError && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                    Error: {writeError.message}
                  </div>
                )}

                {isSuccess && (
                  <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
                    ✅ NFT minted successfully! Check your wallet or go to Create Lottery to use it.
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What are Test NFTs?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Test NFTs are free ERC721 tokens that you can use to test the MeltyFi lottery protocol. Mint them for
                free and create your own NFT lotteries!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ol className="list-decimal list-inside space-y-1">
                <li>Click &quot;Mint Free NFT&quot; button</li>
                <li>Confirm the transaction in your wallet</li>
                <li>Wait for the transaction to be confirmed</li>
                <li>Use your NFT to create a lottery!</li>
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Contract Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contract Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">TestNFT Contract:</span>
              <code className="bg-muted px-2 py-1 rounded font-mono text-xs">{testNFTAddress}</code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
