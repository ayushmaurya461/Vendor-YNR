import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { SidebarService } from '../../core/services/sidebar.service';

@Component({
  selector: 'app-sidebar-toggle',
  standalone: true,
  styleUrl: './sidebar-toggle.component.css',
  template: `
    @if (auth.isLoggedIn()) {
      <button
        type="button"
        class="sidebar-toggle"
        [class.sidebar-toggle--floating]="placement() === 'floating'"
        [attr.aria-label]="sidebar.isOpen() ? 'Close menu' : 'Open menu'"
        (click)="sidebar.toggle()"
      >
        {{ sidebar.isOpen() ? '✕' : '☰' }}
      </button>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarToggleComponent {
  readonly placement = input<'header' | 'floating'>('header');
  readonly sidebar = inject(SidebarService);
  readonly auth = inject(AuthService);
}
