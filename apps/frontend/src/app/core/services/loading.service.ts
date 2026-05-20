import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly activeCount = signal(0);

  readonly isLoading = computed(() => this.activeCount() > 0);

  start(): void {
    this.activeCount.update((count) => count + 1);
  }

  stop(): void {
    this.activeCount.update((count) => Math.max(0, count - 1));
  }
}
