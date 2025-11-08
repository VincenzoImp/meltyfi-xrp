/**
 * MeltyFi Protocol Constants
 */

// Protocol Parameters
export const PROTOCOL_FEE_PERCENTAGE = 500; // 5% in basis points
export const OWNER_PERCENTAGE = 9500; // 95% in basis points
export const BASIS_POINTS = 10000;

export const MAX_WONKA_BARS_PER_LOTTERY = 100;
export const MIN_WONKA_BARS_PER_LOTTERY = 5;
export const MAX_USER_BALANCE_PERCENTAGE = 25; // 25% max per user

export const CHOCO_CHIPS_PER_ETH = 1000n; // 1000 CHOC per 1 ETH spent
export const CHOCO_CHIP_MAX_SUPPLY = 1_000_000_000n * 10n ** 18n; // 1 billion CHOC

// DAO Governance Parameters
export const VOTING_DELAY_BLOCKS = 1;
export const VOTING_PERIOD_BLOCKS = 50_400; // ~7 days on most chains
export const PROPOSAL_THRESHOLD = 100_000n * 10n ** 18n; // 100,000 CHOC
export const QUORUM_PERCENTAGE = 4; // 4% of total supply
export const TIMELOCK_DELAY = 48 * 60 * 60; // 48 hours in seconds

// Lottery States - Must match contract enum exactly
export enum LotteryState {
  ACTIVE = 0, // Lottery accepting purchases
  CANCELLED = 1, // Owner repaid, participants get refunds
  CONCLUDED = 2, // Lottery expired/sold out, winner drawn
  TRASHED = 3, // No sales, NFT returned to owner
}

export const LOTTERY_STATE_LABELS: Record<LotteryState, string> = {
  [LotteryState.ACTIVE]: "Active",
  [LotteryState.CANCELLED]: "Cancelled",
  [LotteryState.CONCLUDED]: "Concluded",
  [LotteryState.TRASHED]: "Trashed",
};

export const LOTTERY_STATE_COLORS: Record<LotteryState, string> = {
  [LotteryState.ACTIVE]: "bg-green-500",
  [LotteryState.CANCELLED]: "bg-gray-500",
  [LotteryState.CONCLUDED]: "bg-blue-500",
  [LotteryState.TRASHED]: "bg-yellow-500",
};

// Duration Limits
export const MIN_DURATION_DAYS = 1;
export const MAX_DURATION_DAYS = 90;

// Polling Intervals (in milliseconds)
export const POLL_INTERVAL_ACTIVE_LOTTERIES = 15_000; // 15 seconds
export const POLL_INTERVAL_LOTTERY_DETAILS = 10_000; // 10 seconds
export const POLL_INTERVAL_USER_STATS = 30_000; // 30 seconds

// Chain-specific settings
export const BLOCK_TIME_SECONDS = 12; // Ethereum average block time

// UI Constants
export const ITEMS_PER_PAGE = 12;
export const MAX_FEATURED_LOTTERIES = 5;

// External Links
export const OPENSEA_BASE_URL = "https://opensea.io/assets";
export const ETHERSCAN_BASE_URL = "https://etherscan.io";
export const DOCS_URL = "https://docs.meltyfi.io"; // placeholder
export const DISCORD_URL = "https://discord.gg/meltyfi"; // placeholder
export const TWITTER_URL = "https://twitter.com/meltyfi"; // placeholder

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Please connect your wallet to continue",
  INSUFFICIENT_BALANCE: "Insufficient balance",
  TRANSACTION_REJECTED: "Transaction was rejected",
  NETWORK_ERROR: "Network error occurred. Please try again.",
  INVALID_INPUT: "Invalid input provided",
  NFT_NOT_OWNED: "You don't own this NFT",
  LOTTERY_NOT_FOUND: "Lottery not found",
  LOTTERY_INACTIVE: "This lottery is not active",
  MAX_SUPPLY_EXCEEDED: "Maximum supply exceeded",
  MAX_BALANCE_EXCEEDED: "Would exceed maximum balance per user (25%)",
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOTTERY_CREATED: "Lottery created successfully!",
  WONKA_BARS_PURCHASED: "WonkaBars purchased successfully!",
  LOAN_REPAID: "Loan repaid and NFT returned!",
  WONKA_BARS_MELTED: "WonkaBars melted for refund!",
  NFT_CLAIMED: "NFT claimed successfully!",
};
