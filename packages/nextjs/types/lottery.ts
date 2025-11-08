import { type Address } from "viem";
import { LotteryState } from "~~/lib/constants";

/**
 * Lottery data structure matching smart contract
 */
export interface Lottery {
  id: number;
  owner: Address;
  nftContract: Address;
  nftTokenId: bigint;
  nftName: string;
  nftImageUrl: string;
  wonkaBarPrice: bigint;
  wonkaBarsMaxSupply: number;
  wonkaBarsSold: number;
  totalRaised: bigint;
  state: LotteryState;
  expirationDate: Date;
  winner?: Address;
}

/**
 * Lottery creation form data
 */
export interface CreateLotteryFormData {
  nftContract: Address;
  nftTokenId: bigint;
  nftName: string;
  nftImageUrl: string;
  wonkaBarPrice: string; // in ETH (user input)
  wonkaBarsMaxSupply: number;
  durationInDays: number;
}

/**
 * Lottery filters for browsing
 */
export interface LotteryFilters {
  search: string;
  state: "all" | "active" | "ending-soon" | "sold-out";
  sortBy: "newest" | "ending-soon" | "price-low" | "price-high" | "popularity";
  priceRange: [number, number];
  collections: Address[];
}

/**
 * Participant in a lottery
 */
export interface Participant {
  address: Address;
  wonkaBarsOwned: number;
  winProbability: number; // in basis points (0-10000)
}

/**
 * Lottery activity event
 */
export interface LotteryActivity {
  type: "created" | "purchase" | "repayment" | "ended" | "claimed";
  timestamp: Date;
  user: Address;
  amount?: bigint;
  wonkaBars?: number;
}

/**
 * Protocol statistics
 */
export interface ProtocolStats {
  totalLotteries: number;
  activeLotteries: number;
  totalValueLocked: bigint;
  totalParticipants: number;
  totalChocoChipsDistributed: bigint;
}

/**
 * User statistics
 */
export interface UserStats {
  ethBalance: bigint;
  chocoChipBalance: bigint;
  totalLotteriesCreated: number;
  activeLotteriesOwned: number;
  totalWonkaBarsOwned: number;
  lotteriesWon: number;
  totalValueLocked: bigint;
  totalEarned: bigint;
}
