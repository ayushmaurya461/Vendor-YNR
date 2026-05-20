import { Injectable, computed, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'ynr_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly theme = signal<ThemeMode>(this.readStoredTheme());

  readonly mode = this.theme.asReadonly();
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    effect(() => {
      const mode = this.theme();
      document.documentElement.setAttribute('data-theme', mode);
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch {
        /* private browsing / quota */
      }
    });
  }

  setDark(enabled: boolean): void {
    this.theme.set(enabled ? 'dark' : 'light');
  }

  private readStoredTheme(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      /* unavailable */
    }
    return 'dark';
  }
}
