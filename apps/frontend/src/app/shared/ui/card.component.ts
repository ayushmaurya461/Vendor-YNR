import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  styleUrl: './card.component.css',
  template: `<section class="card"><ng-content /></section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {}
