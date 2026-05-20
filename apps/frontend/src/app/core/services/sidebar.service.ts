import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const PERSISTENT_SIDEBAR_MQ = '(min-width: 900px)';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly isOpen = signal(this.initialOpen());
  readonly panel = signal<'main' | 'settings'>('main');

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const mq = window.matchMedia(PERSISTENT_SIDEBAR_MQ);
    const sync = (): void => {
      if (mq.matches) {
        this.isOpen.set(true);
      }
    };
    sync();
    mq.addEventListener('change', sync);
  }

  private initialOpen(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return window.matchMedia(PERSISTENT_SIDEBAR_MQ).matches;
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    if (isPlatformBrowser(this.platformId) && window.matchMedia(PERSISTENT_SIDEBAR_MQ).matches) {
      this.panel.set('main');
      return;
    }
    this.isOpen.set(false);
    this.panel.set('main');
  }

  toggle(): void {
    if (isPlatformBrowser(this.platformId) && window.matchMedia(PERSISTENT_SIDEBAR_MQ).matches) {
      return;
    }
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  openSettings(): void {
    this.panel.set('settings');
    this.open();
  }

  closeSettings(): void {
    this.panel.set('main');
  }
}
