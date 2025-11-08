import type { Address } from "viem";

/**
 * NFT Collections Configuration
 *
 * Add the addresses of NFT collections you want to support in MeltyFi.
 * These collections MUST implement ERC721Enumerable with the tokensOfOwner() function.
 *
 * To add a collection:
 * 1. Deploy an ERC721Enumerable NFT contract on XRP EVM
 * 2. Add the contract address to the appropriate network array below
 * 3. Users will be able to see and select NFTs from these collections
 *
 * Required NFT contract functions:
 * - tokensOfOwner(address owner) returns (uint256[])
 * - tokenURI(uint256 tokenId) returns (string)
 * - name() returns (string)
 */

/**
 * NFTFaucet Factory Addresses
 * These factories can create and manage multiple NFT collections.
 * Use the useNFTFaucetCollections hook to fetch collections dynamically.
 */
export const NFT_FAUCET_FACTORIES = {
  // XRP EVM Testnet - NFT Faucet Factory deployed
  1449000: "0x105f1e0Fb9B1C17ACDFEC8CB0B3b7002F8269a90" as Address,
  // XRP EVM Mainnet - Deploy factory here
  1440000: undefined as Address | undefined,
  // Hardhat local - Factory address after deployment
  31337: "0xCace1b78160AE76398F486c8a18044da0d66d86D" as Address,
} as const;

/**
 * Static NFT Collections
 * Add manually deployed NFT collection addresses here
 */

// XRP EVM Mainnet NFT Collections
export const XRPL_MAINNET_NFT_COLLECTIONS: Address[] = [
  // Add your mainnet NFT collection addresses here
  // Example: "0x1234567890123456789012345678901234567890" as Address,
];

// XRP EVM Testnet NFT Collections
// Note: Collections from NFTFaucet factory (0x105f1e0Fb9B1C17ACDFEC8CB0B3b7002F8269a90)
// can be fetched dynamically using getAllCollections()
export const XRPL_TESTNET_NFT_COLLECTIONS: Address[] = [
  // Manual collections can be added here if not using the factory
  // The NFTFaucet factory manages collections dynamically
  // To see available collections, call getAllCollections() on the factory
];

// Local development NFT Collections (Hardhat)
export const LOCAL_NFT_COLLECTIONS: Address[] = [
  // Add your local deployed NFT collection addresses here
  // These will be populated after running `yarn deploy`
];

/**
 * Get NFT collections for a specific chain ID
 * Returns static collections list
 *
 * For dynamic collections from NFTFaucet factory,
 * use the useNFTFaucetCollections hook instead
 */
export function getNFTCollections(chainId: number): Address[] {
  switch (chainId) {
    case 1440000: // XRP EVM Mainnet
      return XRPL_MAINNET_NFT_COLLECTIONS;
    case 1449000: // XRP EVM Testnet
      return XRPL_TESTNET_NFT_COLLECTIONS;
    case 31337: // Hardhat local
      return LOCAL_NFT_COLLECTIONS;
    default:
      console.warn(`No NFT collections configured for chain ID ${chainId}`);
      return [];
  }
}

/**
 * Get NFTFaucet factory address for a chain
 */
export function getNFTFaucetFactory(chainId: number): Address | undefined {
  return NFT_FAUCET_FACTORIES[chainId as keyof typeof NFT_FAUCET_FACTORIES];
}
