import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { APP_LOCATION } from '../../core/constants/app-location';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-location-label',
  standalone: true,
  imports: [IconComponent],
  styleUrl: './location-label.component.css',
  template: `
    <p class="location-label">
      <app-icon name="location" [size]="16" />
      <span>{{ location() }}</span>
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationLabelComponent {
  readonly location = input(APP_LOCATION);
}
