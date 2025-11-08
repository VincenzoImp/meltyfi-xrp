import { type Address } from "viem";

/**
 * NFT metadata structure
 */
export interface NFT {
  contract: Address;
  tokenId: bigint;
  name: string;
  description?: string;
  image: string;
  owner: Address;
  collection?: {
    name: string;
    verified: boolean;
  };
  attributes?: NFTAttribute[];
}

/**
 * NFT attribute/trait
 */
export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: "number" | "boost_percentage" | "boost_number" | "date";
}

/**
 * NFT collection information
 */
export interface NFTCollection {
  address: Address;
  name: string;
  symbol: string;
  totalSupply?: number;
  verified: boolean;
  logoUrl?: string;
  externalUrl?: string;
}

/**
 * NFT metadata from OpenSea/external API
 */
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: NFTAttribute[];
  background_color?: string;
  animation_url?: string;
}
