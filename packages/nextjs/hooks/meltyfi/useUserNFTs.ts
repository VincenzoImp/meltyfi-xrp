import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getTestNFTAddress } from "~~/lib/nft-collections";

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
    // Skip if tokenURI is empty or invalid
    if (!tokenURI || tokenURI.trim() === "") {
      return null;
    }

    // Handle IPFS URIs
    let url = tokenURI;
    if (url.startsWith("ipfs://")) {
      url = url.replace("ipfs://", "https://ipfs.io/ipfs/");
    }

    // Skip if URL is not valid HTTP/HTTPS
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return null;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const metadata: NFTMetadata = await response.json();

    // Process image URL
    if (metadata.image) {
      // Handle IPFS URIs
      if (metadata.image.startsWith("ipfs://")) {
        metadata.image = metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/");
      }
      // Keep relative paths as-is (e.g., "/nft-images/0.png")
      // They will be served from the public folder
      // Don't convert them to absolute URLs with localhost
    }

    return metadata;
  } catch (error) {
    console.error("Error fetching NFT metadata:", error);
    return null;
  }
}

/**
 * Hook to fetch user's NFTs from the TestNFT collection
 * Uses ERC721Enumerable pattern to efficiently fetch all tokens owned by a user
 */
export function useUserNFTs(address: `0x${string}` | undefined) {
  const publicClient = usePublicClient();
  const { targetNetwork } = useTargetNetwork();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!address || !publicClient) {
        setNfts([]);
        setIsLoading(false);
        return;
      }

      // Get TestNFT address for current network
      const testNFTAddress = getTestNFTAddress(targetNetwork.name);
      if (!testNFTAddress || testNFTAddress === "0x0000000000000000000000000000000000000000") {
        setNfts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      const fetchedNFTs: NFT[] = [];

      try {
        // Get collection name
        const collectionName = await publicClient.readContract({
          address: testNFTAddress,
          abi: ERC721_ENUMERABLE_ABI,
          functionName: "name",
        });

        // Get all token IDs owned by user using ERC721Enumerable
        const tokenIds = await publicClient.readContract({
          address: testNFTAddress,
          abi: ERC721_ENUMERABLE_ABI,
          functionName: "tokensOfOwner",
          args: [address],
        });

        // Fetch metadata for each token
        for (const tokenId of tokenIds) {
          try {
            const tokenURI = await publicClient.readContract({
              address: testNFTAddress,
              abi: ERC721_ENUMERABLE_ABI,
              functionName: "tokenURI",
              args: [tokenId],
            });

            // Fetch and parse metadata
            const metadata = await fetchNFTMetadata(tokenURI);

            fetchedNFTs.push({
              contract: testNFTAddress,
              tokenId: tokenId.toString(),
              name: metadata?.name || `${collectionName} #${tokenId}`,
              image: metadata?.image || "/placeholder-nft.png",
              collectionName: collectionName || "MeltyFi Test NFTs",
            });
          } catch (error) {
            console.error(`Error loading token ${tokenId}:`, error);
            // Continue with next token on error
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
  }, [address, publicClient, targetNetwork.name, refetchCounter]);

  return {
    nfts,
    isLoading,
    error,
    refetch: () => setRefetchCounter(prev => prev + 1),
  };
}
