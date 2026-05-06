import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'app-input',
  standalone: true,
  template: `
    <input
      class="input"
      [type]="type()"
      [placeholder]="placeholder()"
      [value]="value()"
      (input)="value.set(($any($event.target)).value)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent {
  readonly type = input('text');
  readonly placeholder = input('');
  readonly value = model<string>('');
}
