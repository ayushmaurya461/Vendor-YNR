import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  styleUrl: './badge.component.css',
  template: `
    <span class="badge" [class.badge--success]="tone() === 'success'" [class.badge--danger]="tone() === 'danger'">
      <ng-content />
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  readonly tone = input<'success' | 'danger'>('success');
}
