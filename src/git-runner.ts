// src/git-runner.ts
import { exec } from "child_process";

export interface GitStatus {
  changedCount: number;
  output: string;
}

export class GitRunner {
  constructor(
    private repoPath: string,
    private nuPath: string = "nu",
  ) {}

  private run(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(
        `${this.nuPath} -c "${command}"`,
        { cwd: this.repoPath },
        (error, stdout) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(String(stdout));
        },
      );
    });
  }

  async status(): Promise<GitStatus> {
    const output = await this.run("git status --porcelain");
    const lines = output.trim().split("\n").filter((l) => l.length > 0);
    return { changedCount: lines.length, output };
  }

  async commit(message: string): Promise<void> {
    const escaped = message.replace(/'/g, "''");
    await this.run(`git add -A; git commit -m '${escaped}'`);
  }

  async push(): Promise<void> {
    await this.run("git push");
  }

  async pull(): Promise<void> {
    await this.run("git pull");
  }

  async repoRoot(): Promise<string> {
    const output = await this.run("git rev-parse --show-toplevel");
    return output.trim();
  }
}
