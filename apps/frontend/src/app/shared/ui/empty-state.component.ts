import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type EmptyStateIcon = 'search' | 'vendors' | 'saved' | 'info' | 'error';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  styleUrl: './empty-state.component.css',
  host: {
    class: 'empty-state-host',
    '[class.empty-state-host--span]': 'spanFullWidth()',
  },
  template: `
    <div class="empty-state" role="status">
      <div class="empty-state__icon-wrap" aria-hidden="true">
        @switch (icon()) {
          @case ('search') {
            <svg class="empty-state__icon" viewBox="0 0 24 24" focusable="false">
              <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2" />
              <path
                d="M16.5 16.5 21 21"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          }
          @case ('vendors') {
            <svg class="empty-state__icon" viewBox="0 0 24 24" focusable="false">
              <path
                d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
              <circle cx="9.5" cy="7" r="3.5" fill="none" stroke="currentColor" stroke-width="2" />
              <path
                d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          }
          @case ('saved') {
            <svg class="empty-state__icon" viewBox="0 0 24 24" focusable="false">
              <path
                d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
              />
            </svg>
          }
          @case ('error') {
            <svg class="empty-state__icon" viewBox="0 0 24 24" focusable="false">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" />
              <path
                d="M12 8v5M12 16h.01"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          }
          @default {
            <svg class="empty-state__icon" viewBox="0 0 24 24" focusable="false">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" />
              <path
                d="M12 11v5M12 8h.01"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          }
        }
      </div>
      <h3 class="empty-state__title">{{ title() }}</h3>
      @if (description()) {
        <p class="empty-state__desc">{{ description() }}</p>
      }
      <div class="empty-state__actions">
        <ng-content />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly icon = input<EmptyStateIcon>('info');
  /** Span all columns when placed inside a CSS grid (e.g. vendor grid). */
  readonly spanFullWidth = input(false);
}
