import { useEffect, useRef, useState } from "react";
import { useChainId, usePublicClient } from "wagmi";
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

// Simple in-memory metadata cache to avoid refetching the same URIs
const metadataCache = new Map<string, NFTMetadata | null>();
const metadataPromises = new Map<string, Promise<NFTMetadata | null>>();

function normalizeTokenURI(tokenURI: string): string {
  return tokenURI.trim();
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
async function fetchNFTMetadata(tokenURI: string, forceRefresh = false): Promise<NFTMetadata | null> {
  try {
    // Skip if tokenURI is empty or invalid
    if (!tokenURI || tokenURI.trim() === "") {
      return null;
    }
    const normalizedUri = normalizeTokenURI(tokenURI);

    if (forceRefresh) {
      metadataCache.delete(normalizedUri);
      metadataPromises.delete(normalizedUri);
    }

    if (metadataCache.has(normalizedUri)) {
      return metadataCache.get(normalizedUri) ?? null;
    }

    if (metadataPromises.has(normalizedUri)) {
      return metadataPromises.get(normalizedUri) ?? null;
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

    const metadataPromise = (async () => {
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

      metadataCache.set(normalizedUri, metadata);
      return metadata;
    })()
      .catch(error => {
        console.error("Error fetching NFT metadata:", error);
        metadataCache.set(normalizedUri, null);
        return null;
      })
      .finally(() => {
        metadataPromises.delete(normalizedUri);
      });

    metadataPromises.set(normalizedUri, metadataPromise);
    return metadataPromise;
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
  const chainId = useChainId();
  const { targetNetwork } = useTargetNetwork();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);
  const lastRefetchApplied = useRef(0);
  const lastCollectionAddress = useRef<string | null>(null);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!address || !publicClient) {
        setNfts([]);
        setIsLoading(false);
        return;
      }

      // Get TestNFT address for current network
      const resolvedChainId = chainId ?? targetNetwork.id;
      const testNFTAddress = getTestNFTAddress(resolvedChainId);
      if (!testNFTAddress || testNFTAddress === "0x0000000000000000000000000000000000000000") {
        setNfts([]);
        setIsLoading(false);
        return;
      }

      const collectionChanged = lastCollectionAddress.current !== testNFTAddress;
      if (collectionChanged) {
        metadataCache.clear();
        metadataPromises.clear();
        lastCollectionAddress.current = testNFTAddress;
      }

      setIsLoading(true);
      setError(null);
      const fetchedNFTs: NFT[] = [];
      const shouldForceRefresh =
        (refetchCounter > 0 && lastRefetchApplied.current !== refetchCounter) || collectionChanged;

      if (shouldForceRefresh && !collectionChanged) {
        metadataCache.clear();
        metadataPromises.clear();
      }

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
            const metadata = await fetchNFTMetadata(tokenURI, shouldForceRefresh);

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
        if (shouldForceRefresh) {
          lastRefetchApplied.current = refetchCounter;
        }
      }
    };

    fetchNFTs();
  }, [address, publicClient, targetNetwork.name, targetNetwork.id, chainId, refetchCounter]);

  return {
    nfts,
    isLoading,
    error,
    refetch: () => setRefetchCounter(prev => prev + 1),
  };
}
