import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'app-toggle',
  standalone: true,
  styleUrl: './toggle.component.css',
  template: `
    <div class="toggle-field" [class.toggle-field--disabled]="disabled()">
      <div class="toggle-field__content">
        <ng-content />
      </div>
      <button
        type="button"
        class="toggle"
        role="switch"
        [attr.aria-checked]="checked()"
        [attr.aria-label]="ariaLabel() || null"
        [class.toggle--on]="checked()"
        [disabled]="disabled()"
        (click)="onToggle()"
      ></button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleComponent {
  readonly checked = model(false);
  readonly disabled = input(false);
  readonly ariaLabel = input<string | undefined>(undefined);

  onToggle(): void {
    if (this.disabled()) {
      return;
    }
    this.checked.set(!this.checked());
  }
}
