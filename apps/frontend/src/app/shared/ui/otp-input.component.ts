import { ChangeDetectionStrategy, Component, model } from '@angular/core';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  styleUrl: './otp-input.component.css',
  template: `
    <div class="otp">
      @for (digit of digits; track $index) {
        <input class="otp__box" maxlength="1" inputmode="numeric" [value]="digit" (input)="onInput($index, $event)" />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OtpInputComponent {
  readonly value = model<string>('');

  get digits(): string[] {
    return this.value().padEnd(4, ' ').split('').slice(0, 4).map((digit) => (digit === ' ' ? '' : digit));
  }

  onInput(index: number, event: Event): void {
    const element = event.target as HTMLInputElement;
    const value = (element.value || '').replace(/\D/g, '').slice(0, 1);
    const next = [...this.digits];
    next[index] = value;
    this.value.set(next.join('').trim());

    if (value && element.nextElementSibling instanceof HTMLInputElement) {
      element.nextElementSibling.focus();
    }
  }
}
