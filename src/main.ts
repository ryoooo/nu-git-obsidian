// src/main.ts
import { Notice, Plugin, TFile } from "obsidian";
import { GitRunner } from "./git-runner";
import { Scheduler } from "./scheduler";
import { isLocked, cleanStaleLock } from "./lock";

interface NuGitSettings {
  debounceSeconds: number;
  autoPush: boolean;
  nuPath: string;
  staleLockThresholdMs: number;
}

const DEFAULT_SETTINGS: NuGitSettings = {
  debounceSeconds: 30,
  autoPush: true,
  nuPath: "nu",
  staleLockThresholdMs: 120_000,
};

export default class NuGitPlugin extends Plugin {
  private settings!: NuGitSettings;
  private git!: GitRunner;
  private scheduler!: Scheduler;
  private statusBarEl!: HTMLElement;

  async onload(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    const adapter = this.app.vault.adapter as any;
    const vaultPath: string = adapter.getBasePath();

    // Vault path から git repo root を発見する（Vaultがサブディレクトリの場合に対応）
    const tempGit = new GitRunner(vaultPath, this.settings.nuPath);
    const repoRoot = await tempGit.repoRoot();

    this.git = new GitRunner(repoRoot, this.settings.nuPath);

    this.scheduler = new Scheduler(
      () => this.backup(),
      {
        debounceMs: this.settings.debounceSeconds * 1000,
        lockCheckFn: async () => {
          cleanStaleLock(repoRoot, this.settings.staleLockThresholdMs);
          return isLocked(repoRoot);
        },
      },
    );

    // ステータスバー
    this.statusBarEl = this.addStatusBarItem();
    this.statusBarEl.addClass("nu-git-status");
    this.statusBarEl.onClickEvent(() => this.backupNow());
    // 起動時に自動pull
    try {
      this.setStatus("pulling...");
      await this.git.pull();
    } catch {
      // pull失敗は無視（オフライン等）
    }

    await this.refreshStatus();

    // ファイル変更イベント
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof TFile) this.scheduler.trigger();
      }),
    );
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (file instanceof TFile) this.scheduler.trigger();
      }),
    );
    this.registerEvent(
      this.app.vault.on("delete", () => this.scheduler.trigger()),
    );
    this.registerEvent(
      this.app.vault.on("rename", () => this.scheduler.trigger()),
    );

    // コマンド
    this.addCommand({
      id: "backup-now",
      name: "Backup now",
      callback: () => this.backupNow(),
    });
    this.addCommand({
      id: "commit",
      name: "Commit",
      callback: () => this.commitOnly(),
    });
    this.addCommand({
      id: "push",
      name: "Push",
      callback: () => this.pushOnly(),
    });
    this.addCommand({
      id: "pull",
      name: "Pull",
      callback: () => this.pullOnly(),
    });
  }

  onunload(): void {
    this.scheduler.destroy();
  }

  private async backup(): Promise<void> {
    this.setStatus("committing...");
    try {
      const status = await this.git.status();
      if (status.changedCount === 0) {
        this.setStatus("synced");
        return;
      }

      const now = new Date();
      const msg = `vault backup: ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      await this.git.commit(msg);

      if (this.settings.autoPush) {
        this.setStatus("pushing...");
        await this.git.push();
      }

      this.setStatus("synced");
      new Notice(`Nu Git: backed up (${status.changedCount} files)`);
    } catch (e) {
      this.setStatus("error");
      new Notice(`Nu Git: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  private async backupNow(): Promise<void> {
    await this.backup();
  }

  private async commitOnly(): Promise<void> {
    this.setStatus("committing...");
    try {
      const status = await this.git.status();
      if (status.changedCount === 0) {
        new Notice("Nu Git: no changes");
        this.setStatus("synced");
        return;
      }
      const now = new Date();
      const msg = `vault backup: ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      await this.git.commit(msg);
      this.setStatus("committed");
      new Notice("Nu Git: committed");
    } catch (e) {
      this.setStatus("error");
      new Notice(`Nu Git: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  private async pushOnly(): Promise<void> {
    this.setStatus("pushing...");
    try {
      await this.git.push();
      this.setStatus("synced");
      new Notice("Nu Git: pushed");
    } catch (e) {
      this.setStatus("error");
      new Notice(`Nu Git: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  private async pullOnly(): Promise<void> {
    this.setStatus("pulling...");
    try {
      await this.git.pull();
      this.setStatus("synced");
      new Notice("Nu Git: pulled");
    } catch (e) {
      this.setStatus("error");
      new Notice(`Nu Git: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  private setStatus(text: string): void {
    this.statusBarEl.setText(`Git: ${text}`);
  }

  private async refreshStatus(): Promise<void> {
    try {
      const status = await this.git.status();
      this.setStatus(
        status.changedCount === 0
          ? "synced"
          : `${status.changedCount} changes`,
      );
    } catch {
      this.setStatus("error");
    }
  }
}
