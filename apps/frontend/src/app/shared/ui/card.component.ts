import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `<section class="card"><ng-content /></section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {}
