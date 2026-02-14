export interface SchedulerOptions {
  debounceMs: number;
  lockCheckFn: () => Promise<boolean>;
}

export class Scheduler {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private pendingWhileRunning = false;

  constructor(
    private action: () => Promise<void>,
    private options: SchedulerOptions,
  ) {}

  trigger(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => this.execute(), this.options.debounceMs);
  }

  private async execute(): Promise<void> {
    this.timer = null;

    if (this.running) {
      this.pendingWhileRunning = true;
      return;
    }

    const locked = await this.options.lockCheckFn();
    if (locked) {
      return;
    }

    this.running = true;
    try {
      await this.action();
    } finally {
      this.running = false;
      if (this.pendingWhileRunning) {
        this.pendingWhileRunning = false;
        this.trigger();
      }
    }
  }

  destroy(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
