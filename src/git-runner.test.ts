// src/git-runner.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitRunner } from "./git-runner";

// child_process.exec をモック
vi.mock("child_process", () => ({
  exec: vi.fn(),
}));

import { exec } from "child_process";
const mockExec = vi.mocked(exec);

describe("GitRunner", () => {
  let runner: GitRunner;

  beforeEach(() => {
    runner = new GitRunner("/path/to/repo", "nu");
    vi.clearAllMocks();
  });

  it("status returns parsed output", async () => {
    mockExec.mockImplementation((_cmd, _opts, cb: any) => {
      cb(null, " M file.md\n?? new.md\n", "");
      return {} as any;
    });

    const result = await runner.status();
    expect(result.changedCount).toBe(2);
    expect(mockExec).toHaveBeenCalledWith(
      'nu -c "git status --porcelain"',
      expect.objectContaining({ cwd: "/path/to/repo" }),
      expect.any(Function),
    );
  });

  it("commit runs add and commit via nushell", async () => {
    mockExec.mockImplementation((_cmd, _opts, cb: any) => {
      cb(null, "", "");
      return {} as any;
    });

    await runner.commit("test message");
    expect(mockExec).toHaveBeenCalledWith(
      'nu -c "git add -A; git commit -m \'test message\'"',
      expect.objectContaining({ cwd: "/path/to/repo" }),
      expect.any(Function),
    );
  });

  it("push runs git push via nushell", async () => {
    mockExec.mockImplementation((_cmd, _opts, cb: any) => {
      cb(null, "", "");
      return {} as any;
    });

    await runner.push();
    expect(mockExec).toHaveBeenCalledWith(
      'nu -c "git push"',
      expect.objectContaining({ cwd: "/path/to/repo" }),
      expect.any(Function),
    );
  });

  it("pull runs git pull via nushell", async () => {
    mockExec.mockImplementation((_cmd, _opts, cb: any) => {
      cb(null, "", "");
      return {} as any;
    });

    await runner.pull();
    expect(mockExec).toHaveBeenCalledWith(
      'nu -c "git pull"',
      expect.objectContaining({ cwd: "/path/to/repo" }),
      expect.any(Function),
    );
  });

  it("throws on exec error", async () => {
    mockExec.mockImplementation((_cmd, _opts, cb: any) => {
      cb(new Error("command failed"), "", "fatal");
      return {} as any;
    });

    await expect(runner.status()).rejects.toThrow("command failed");
  });
});
