import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName = 'location' | 'phone' | 'whatsapp' | 'bookmark';

@Component({
  selector: 'app-icon',
  standalone: true,
  styleUrl: './icon.component.css',
  template: `
    <svg
      class="icon"
      [class.icon--whatsapp]="name() === 'whatsapp'"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      focusable="false"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('location') {
          <path
            d="M12 21s-6-5.15-6-10a6 6 0 1 1 12 0c0 4.85-6 10-6 10Z"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle cx="12" cy="11" r="2.5" fill="currentColor" stroke="none" />
        }
        @case ('phone') {
          <path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        }
        @case ('bookmark') {
          <path
            d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z"
            [attr.fill]="filled() ? 'currentColor' : 'none'"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        }
        @case ('whatsapp') {
          <g class="icon-whatsapp">
            <path
              class="icon-whatsapp__bubble"
              d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.986-1.31A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"
            />
            <path
              class="icon-whatsapp__handset"
              d="M16.78 14.95c-.25-.12-1.47-.77-1.69-.86-.22-.09-.38-.15-.54.23-.16.38-.63 1.03-.77 1.25-.14.22-.28.24-.52.08-.24-.12-1.01-.39-1.92-1.2-.74-.65-1.24-1.37-1.38-1.61-.14-.24-.01-.37.1-.49.1-.1.23-.29.34-.43.11-.14.15-.24.23-.4.08-.16.04-.3-.02-.43-.06-.13-.56-1.19-.76-1.63-.2-.44-.41-.37-.56-.38-.15-.01-.32-.01-.49-.01-.17 0-.44.09-.67.34-.23.25-.89.86-.89 2.1 0 1.24.91 2.44 1.04 2.6.13.16 1.14 1.63 2.77 2.3.49.21.87.33 1.17.43.39.13.74.11 1.03.07.3-.05.98-.5 1.13-.97.15-.47.15-.88.1-.97-.05-.09-.22-.15-.46-.26z"
            />
          </g>
        }
      }
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(18);
  /** When true, bookmark icon renders filled (saved state). */
  readonly filled = input(false);
}
