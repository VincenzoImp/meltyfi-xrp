import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MyTicketsTab } from "~~/components/meltyfi/profile/MyTicketsTab";

const mockUseUserParticipations = vi.fn();
const mockUseLottery = vi.fn();
const mockUseWonkaBar = vi.fn();

vi.mock("~~/hooks/meltyfi", () => ({
  useUserParticipations: (address?: `0x${string}`) => mockUseUserParticipations(address),
  useLottery: (lotteryId: number) => mockUseLottery(lotteryId),
  useWonkaBar: (userAddress?: `0x${string}`, lotteryId?: number) =>
    mockUseWonkaBar(userAddress as `0x${string}`, lotteryId as number),
}));

describe("MyTicketsTab", () => {
  const viewerAddress = "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`;

  beforeEach(() => {
    mockUseUserParticipations.mockReset();
    mockUseLottery.mockReset();
    mockUseWonkaBar.mockReset();
  });

  it("renders empty state when no tickets are owned", () => {
    mockUseUserParticipations.mockReturnValue({ lotteryIds: [], isLoading: false });

    const { getByText } = render(<MyTicketsTab address={viewerAddress} isOwnProfile />);

    expect(getByText("You don't have any tickets yet")).toBeInTheDocument();
  });

  it("renders ticket card when balances exist", () => {
    mockUseUserParticipations.mockReturnValue({ lotteryIds: [1n], isLoading: false });
    mockUseLottery.mockReturnValue({
      lottery: {
        id: 1,
        nftName: "Test NFT",
        nftImageUrl: "",
        wonkaBarsMaxSupply: 10,
        wonkaBarsSold: 5,
        wonkaBarPrice: 1n,
        state: 0,
      },
      isLoading: false,
      error: null,
    });
    mockUseWonkaBar.mockReturnValue({ balance: 2n, isLoading: false, error: null });

    const { getByText } = render(<MyTicketsTab address={viewerAddress} isOwnProfile />);

    expect(getByText("Test NFT")).toBeInTheDocument();
    expect(getByText("Your Tickets")).toBeInTheDocument();
  });
});
