import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBuyWonkaBars } from "~~/hooks/meltyfi/useBuyWonkaBars";

const mockWriteContractAsync = vi.fn();

vi.mock("wagmi", () => ({
  useChainId: () => 31337,
  useWriteContract: () => ({
    writeContractAsync: mockWriteContractAsync,
  }),
}));

vi.mock("~~/hooks/scaffold-eth", () => ({
  useTransactor: () => async (fn: () => Promise<unknown>) => fn(),
}));

describe("useBuyWonkaBars", () => {
  beforeEach(() => {
    mockWriteContractAsync.mockReset();
  });

  it("marks transaction as successful when write succeeds", async () => {
    mockWriteContractAsync.mockResolvedValueOnce({ hash: "0x123" });

    const { result } = renderHook(() => useBuyWonkaBars());
    expect(result.current.canTransact).toBe(true);

    await act(async () => {
      await result.current.buyWonkaBars(1, 1, 1n);
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBeNull();
    expect(mockWriteContractAsync).toHaveBeenCalledTimes(1);
  });

  it("surfaces errors when write fails", async () => {
    const failure = new Error("write reverted");
    mockWriteContractAsync.mockRejectedValueOnce(failure);

    const { result } = renderHook(() => useBuyWonkaBars());

    await act(async () => {
      await result.current.buyWonkaBars(1, 1, 1n);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error?.message).toContain("write reverted");
  });
});
