// src/scheduler.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Scheduler } from "./scheduler";

describe("Scheduler", () => {
  let scheduler: Scheduler;
  let mockAction: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockAction = vi.fn().mockResolvedValue(undefined);
    scheduler = new Scheduler(mockAction, {
      debounceMs: 5000,
      lockCheckFn: async () => false,
    });
  });

  afterEach(() => {
    scheduler.destroy();
    vi.useRealTimers();
  });

  it("debounces multiple triggers into one action", async () => {
    scheduler.trigger();
    scheduler.trigger();
    scheduler.trigger();

    expect(mockAction).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5000);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it("skips when lock exists", async () => {
    const lockedScheduler = new Scheduler(mockAction, {
      debounceMs: 5000,
      lockCheckFn: async () => true,
    });

    lockedScheduler.trigger();
    await vi.advanceTimersByTimeAsync(5000);

    expect(mockAction).not.toHaveBeenCalled();
    lockedScheduler.destroy();
  });

  it("skips when already running", async () => {
    let resolveAction: () => void;
    const slowAction = vi.fn().mockImplementation(
      () => new Promise<void>((r) => { resolveAction = r; }),
    );
    const s = new Scheduler(slowAction, {
      debounceMs: 1000,
      lockCheckFn: async () => false,
    });

    s.trigger();
    await vi.advanceTimersByTimeAsync(1000);
    expect(slowAction).toHaveBeenCalledTimes(1);

    s.trigger();
    await vi.advanceTimersByTimeAsync(1000);
    expect(slowAction).toHaveBeenCalledTimes(1);

    resolveAction!();
    await vi.advanceTimersByTimeAsync(0);

    s.trigger();
    await vi.advanceTimersByTimeAsync(1000);
    expect(slowAction).toHaveBeenCalledTimes(2);

    s.destroy();
  });

  it("retries on next trigger after lock skip", async () => {
    let locked = true;
    const s = new Scheduler(mockAction, {
      debounceMs: 1000,
      lockCheckFn: async () => locked,
    });

    s.trigger();
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockAction).not.toHaveBeenCalled();

    locked = false;
    s.trigger();
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockAction).toHaveBeenCalledTimes(1);

    s.destroy();
  });
});
