import { getContractsByChainId } from "./contracts";
import type { Address } from "viem";

/**
 * NFT Collections Configuration
 *
 * MeltyFi uses a single TestNFT collection that is deployed with the protocol.
 * Users can mint NFTs for free from the Free Mint page.
 *
 * The TestNFT collection:
 * - Implements ERC721Enumerable with tokensOfOwner() function
 * - Allows permissionless minting (anyone can mint)
 * - Perfect for testing and demo purposes
 */

/**
 * Get the TestNFT collection address for the current network
 */
export function getTestNFTAddress(chainId: number): Address {
  const contracts = getContractsByChainId(chainId);
  return contracts.TestNFT;
}

/**
 * Get NFT collections for a specific network
 * Returns an array with the single TestNFT collection
 */
export function getNFTCollections(chainId: number): Address[] {
  const testNFT = getTestNFTAddress(chainId);
  return testNFT ? [testNFT] : [];
}
