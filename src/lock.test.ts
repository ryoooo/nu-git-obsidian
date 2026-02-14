// src/lock.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { isLocked, cleanStaleLock } from "./lock";
import * as fs from "fs";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  statSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

describe("isLocked", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns false when no lock file", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(isLocked("/repo")).toBe(false);
  });

  it("returns true when lock file exists", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    expect(isLocked("/repo")).toBe(true);
  });
});

describe("cleanStaleLock", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when no lock file", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    cleanStaleLock("/repo", 60_000);
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });

  it("removes lock older than threshold", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      mtimeMs: Date.now() - 120_000,
    } as fs.Stats);

    cleanStaleLock("/repo", 60_000);
    expect(fs.unlinkSync).toHaveBeenCalledWith("/repo/.git/index.lock");
  });

  it("keeps lock newer than threshold", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      mtimeMs: Date.now() - 10_000,
    } as fs.Stats);

    cleanStaleLock("/repo", 60_000);
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });
});
