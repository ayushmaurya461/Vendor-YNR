import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button
      type="button"
      class="btn"
      [class.btn--primary]="variant() === 'primary'"
      [class.btn--secondary]="variant() === 'secondary'"
      [class.btn--ghost]="variant() === 'ghost'"
      [class.btn--danger]="variant() === 'danger'"
      [disabled]="disabled()"
    >
      <ng-content />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'ghost' | 'danger'>('primary');
  readonly disabled = input(false);
}
