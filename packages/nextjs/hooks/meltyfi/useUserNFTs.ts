import { useEffect, useState } from "react";
import type { Address } from "viem";
import { usePublicClient } from "wagmi";

export interface NFT {
  contract: string;
  tokenId: string;
  name: string;
  image: string;
  collectionName: string;
}

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

// ERC721Enumerable ABI for fetching user's tokens
const ERC721_ENUMERABLE_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "tokensOfOwner",
    outputs: [{ type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Fetch NFT metadata from tokenURI
 * Handles IPFS URIs and HTTP URLs
 */
async function fetchNFTMetadata(tokenURI: string): Promise<NFTMetadata | null> {
  try {
    // Handle IPFS URIs
    let url = tokenURI;
    if (url.startsWith("ipfs://")) {
      url = url.replace("ipfs://", "https://ipfs.io/ipfs/");
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const metadata: NFTMetadata = await response.json();

    // Process image URL (handle IPFS)
    if (metadata.image?.startsWith("ipfs://")) {
      metadata.image = metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/");
    }

    return metadata;
  } catch (error) {
    console.error("Error fetching NFT metadata:", error);
    return null;
  }
}

/**
 * Hook to fetch user's NFT collection from on-chain data
 * Uses ERC721Enumerable pattern to efficiently fetch all tokens owned by a user
 *
 * To use this hook with your NFT collections:
 * 1. Add your collection addresses to the collections parameter
 * 2. Ensure your NFT contracts implement ERC721Enumerable with tokensOfOwner()
 */
export function useUserNFTs(address: `0x${string}` | undefined, collections: Address[] = []) {
  const publicClient = usePublicClient();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address || !publicClient) {
      setNfts([]);
      setIsLoading(false);
      return;
    }

    // If no collections provided, set empty and return
    if (collections.length === 0) {
      setNfts([]);
      setIsLoading(false);
      return;
    }

    const fetchNFTs = async () => {
      setIsLoading(true);
      setError(null);
      const fetchedNFTs: NFT[] = [];

      try {
        // Fetch NFTs from each collection
        for (const collectionAddr of collections) {
          try {
            // Get collection name
            const collectionName = await publicClient.readContract({
              address: collectionAddr,
              abi: ERC721_ENUMERABLE_ABI,
              functionName: "name",
            });

            // Get all token IDs owned by user using ERC721Enumerable
            const tokenIds = await publicClient.readContract({
              address: collectionAddr,
              abi: ERC721_ENUMERABLE_ABI,
              functionName: "tokensOfOwner",
              args: [address],
            });

            // Fetch metadata for each token
            for (const tokenId of tokenIds) {
              try {
                const tokenURI = await publicClient.readContract({
                  address: collectionAddr,
                  abi: ERC721_ENUMERABLE_ABI,
                  functionName: "tokenURI",
                  args: [tokenId],
                });

                // Fetch and parse metadata
                const metadata = await fetchNFTMetadata(tokenURI);

                fetchedNFTs.push({
                  contract: collectionAddr,
                  tokenId: tokenId.toString(),
                  name: metadata?.name || `${collectionName} #${tokenId}`,
                  image: metadata?.image || "/placeholder-nft.png",
                  collectionName: collectionName || "Unknown Collection",
                });
              } catch (error) {
                console.error(`Error loading token ${tokenId} from ${collectionAddr}:`, error);
                // Continue with next token on error
              }
            }
          } catch (error) {
            console.error(`Error loading NFTs from collection ${collectionAddr}:`, error);
            // Continue with next collection on error
          }
        }

        setNfts(fetchedNFTs);
      } catch (err) {
        console.error("Error fetching NFTs:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch NFTs"));
        setNfts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTs();
  }, [address, publicClient, JSON.stringify(collections)]);

  return {
    nfts,
    isLoading,
    error,
    refetch: () => {
      if (address && publicClient && collections.length > 0) {
        // Trigger re-fetch by setting loading state
        setIsLoading(true);
        setNfts([]);
      }
    },
  };
}
