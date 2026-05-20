import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  styleUrl: './toast-container.component.css',
  template: `
    <div class="toast-host" aria-live="polite" aria-relevant="additions">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast"
          [class.toast--success]="toast.kind === 'success'"
          [class.toast--error]="toast.kind === 'error'"
          role="status"
          (click)="toastService.dismiss(toast.id)"
        >
          <p class="toast__message">{{ toast.message }}</p>
          <div
            class="toast__progress"
            [style.animation-duration.ms]="toast.durationMs"
            aria-hidden="true"
          ></div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
