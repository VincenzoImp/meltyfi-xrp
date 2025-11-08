import { useEffect, useState } from "react";
import type { Address } from "viem";
import { usePublicClient } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getNFTFaucetFactory } from "~~/lib/nft-collections";

// NFTFaucet Factory ABI for getAllCollections
const NFT_FAUCET_ABI = [
  {
    inputs: [],
    name: "getAllCollections",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Hook to dynamically fetch NFT collections from NFTFaucet factory
 * Falls back to static configuration if no factory is available
 */
export function useNFTFaucetCollections(): {
  collections: Address[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { targetNetwork } = useTargetNetwork();
  const publicClient = usePublicClient();
  const [collections, setCollections] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);

  useEffect(() => {
    const fetchCollections = async () => {
      const factoryAddress = getNFTFaucetFactory(targetNetwork.id);

      // If no factory, return empty array
      if (!factoryAddress || !publicClient) {
        setCollections([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await publicClient.readContract({
          address: factoryAddress,
          abi: NFT_FAUCET_ABI,
          functionName: "getAllCollections",
        });

        setCollections(result as Address[]);
      } catch (err) {
        console.error("Error fetching NFT collections from factory:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch collections"));
        setCollections([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, [targetNetwork.id, publicClient, refetchCounter]);

  return {
    collections,
    isLoading,
    error,
    refetch: () => setRefetchCounter(prev => prev + 1),
  };
}
