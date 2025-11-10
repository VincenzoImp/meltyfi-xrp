import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCreateLottery } from "~~/hooks/meltyfi/useCreateLottery";
import type { CreateLotteryFormData } from "~~/types/lottery";

const mockWriteContractAsync = vi.fn();
const mockReadContract = vi.fn();
const mockGetContractsByChainId = vi.fn();
const mockNotificationError = vi.fn();
const mockNotificationInfo = vi.fn();
const mockUsePublicClient = vi.fn();

vi.mock("wagmi", () => ({
  useChainId: () => 31337,
  usePublicClient: () => mockUsePublicClient(),
  useWriteContract: () => ({
    writeContractAsync: mockWriteContractAsync,
  }),
}));

vi.mock("~~/hooks/scaffold-eth", () => ({
  useTransactor: () => async (fn: () => Promise<unknown>) => fn(),
}));

vi.mock("~~/lib/contracts", async () => {
  const actual = await vi.importActual<typeof import("~~/lib/contracts")>("~~/lib/contracts");
  return {
    ...actual,
    getContractsByChainId: (chainId: number) => mockGetContractsByChainId(chainId),
  };
});

vi.mock("~~/utils/scaffold-eth", async () => {
  const actual = await vi.importActual<typeof import("~~/utils/scaffold-eth")>("~~/utils/scaffold-eth");
  return {
    ...actual,
    notification: {
      ...actual.notification,
      error: mockNotificationError,
      info: mockNotificationInfo,
    },
  };
});

describe("useCreateLottery", () => {
  const baseContracts = {
    ChocoChip: "0x1111111111111111111111111111111111111111",
    WonkaBar: "0x2222222222222222222222222222222222222222",
    PseudoRandomGenerator: "0x3333333333333333333333333333333333333333",
    MeltyFiProtocol: "0x4444444444444444444444444444444444444444",
    TestNFT: "0x5555555555555555555555555555555555555555",
  } as const;

  const formData: CreateLotteryFormData = {
    nftContract: baseContracts.TestNFT,
    nftTokenId: 1n,
    nftName: "Test NFT",
    nftImageUrl: "https://example.com/1.png",
    wonkaBarPrice: "1",
    wonkaBarsMaxSupply: 10,
    durationInDays: 7,
  };

  beforeEach(() => {
    mockWriteContractAsync.mockReset();
    mockReadContract.mockReset();
    mockNotificationError.mockReset();
    mockNotificationInfo.mockReset();
    mockGetContractsByChainId.mockReturnValue(baseContracts);
    mockUsePublicClient.mockReturnValue({
      readContract: mockReadContract,
    });
  });

  it("sets canTransact to false when protocol address is missing", () => {
    mockGetContractsByChainId.mockReturnValueOnce({
      ...baseContracts,
      MeltyFiProtocol: "0x0000000000000000000000000000000000000000",
    });

    const { result } = renderHook(() => useCreateLottery());
    expect(result.current.canTransact).toBe(false);
  });

  it("prevents creation when wallet is not connected", async () => {
    mockUsePublicClient.mockReturnValueOnce(undefined);

    const { result } = renderHook(() => useCreateLottery());

    await act(async () => {
      await result.current.createLottery(formData);
    });

    expect(result.current.isSuccess).toBe(false);
    expect(mockNotificationError).toHaveBeenCalled();
    expect(mockWriteContractAsync).not.toHaveBeenCalled();
  });
});
