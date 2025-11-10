import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits, parseUnits } from "viem";

/**
 * Utility function to merge Tailwind CSS classes
 * Used for conditional styling with shadcn/ui components
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format address for display (0x1234...5678)
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format large numbers with suffixes (K, M, B)
 */
export function formatNumber(num: number | bigint): string {
  const n = typeof num === "bigint" ? Number(num) : num;

  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toString();
}

/**
 * Format wei to XRP with specified decimals
 */
export function formatXrp(wei: bigint, decimals = 4): string {
  try {
    const formatted = formatUnits(wei, 18);
    const numeric = Number.parseFloat(formatted);
    if (Number.isNaN(numeric)) {
      return "0.00";
    }
    return numeric.toFixed(decimals);
  } catch {
    return "0.00";
  }
}

/**
 * Parse XRP string to wei
 */
export function parseXrpToWei(xrp: string): bigint {
  try {
    return parseUnits(xrp, 18);
  } catch {
    return 0n;
  }
}

/**
 * @deprecated Renamed to formatXrp for clarity.
 */
export const formatEth = formatXrp;

/**
 * @deprecated Renamed to parseXrpToWei for clarity.
 */
export const parseEthToWei = parseXrpToWei;

/**
 * Format time remaining in human-readable format
 */
export function formatTimeRemaining(expirationDate: Date): string {
  const now = new Date();
  const diff = expirationDate.getTime() - now.getTime();

  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Calculate percentage with 2 decimals
 */
export function calculatePercentage(part: number | bigint, total: number | bigint): number {
  if (total === 0 || total === 0n) return 0;
  const p = typeof part === "bigint" ? Number(part) : part;
  const t = typeof total === "bigint" ? Number(total) : total;
  return (p / t) * 100;
}

/**
 * Format percentage for display
 */
export function formatPercentage(percentage: number, decimals = 2): string {
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, length = 50): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
