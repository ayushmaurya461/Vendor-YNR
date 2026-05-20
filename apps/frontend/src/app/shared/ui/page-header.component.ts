import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LocationLabelComponent } from './location-label.component';
import { SidebarToggleComponent } from './sidebar-toggle.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  styleUrl: './page-header.component.css',
  imports: [LocationLabelComponent, SidebarToggleComponent],
  template: `
    <header class="page-head" [class.page-head--static]="variant() === 'static'">
      <div class="page-head__titles">
        <h1>{{ title() }}</h1>
        @if (showLocation()) {
          <app-location-label class="page-head__location" />
        }
        @if (subtitle()) {
          <p class="muted page-head__subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="page-head__actions">
        <ng-content select="[pageActions]" />
        <app-sidebar-toggle placement="header" />
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | undefined>(undefined);
  readonly showLocation = input(true);
  readonly variant = input<'sticky' | 'static'>('sticky');
}
