import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error';

export interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
  durationMs: number;
}

const DEFAULT_DURATION_MS = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  success(message: string, durationMs = DEFAULT_DURATION_MS): void {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs = DEFAULT_DURATION_MS): void {
    this.show(message, 'error', durationMs);
  }

  dismiss(id: string): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private show(message: string, kind: ToastKind, durationMs: number): void {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    const id = crypto.randomUUID();
    const toast: Toast = { id, message: trimmed, kind, durationMs };
    this.toasts.update((list) => [...list, toast]);
    window.setTimeout(() => this.dismiss(id), durationMs);
  }
}
