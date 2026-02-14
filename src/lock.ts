// src/lock.ts
import { existsSync, statSync, unlinkSync } from "fs";
import { join } from "path";

function lockPath(repoPath: string): string {
  return join(repoPath, ".git", "index.lock");
}

export function isLocked(repoPath: string): boolean {
  return existsSync(lockPath(repoPath));
}

export function cleanStaleLock(repoPath: string, thresholdMs: number): void {
  const p = lockPath(repoPath);
  if (!existsSync(p)) return;

  const stat = statSync(p);
  if (Date.now() - stat.mtimeMs > thresholdMs) {
    unlinkSync(p);
  }
}
