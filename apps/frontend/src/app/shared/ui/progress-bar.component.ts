import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  styleUrl: './progress-bar.component.css',
  template: `
    <div
      class="progress-bar"
      [class.progress-bar--active]="loading.isLoading()"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-valuenow]="loading.isLoading() ? null : 100"
      [attr.aria-busy]="loading.isLoading()"
      [attr.aria-hidden]="!loading.isLoading()"
    >
      <div class="progress-bar__track">
        <div class="progress-bar__indicator"></div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent {
  readonly loading = inject(LoadingService);
}
