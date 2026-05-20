import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-review-step',
  standalone: true,
  styleUrl: './review-step.component.css',
  template: `
    <article class="card">
      <p class="section-title">Review listing</p>
      <p><strong>{{ form().value.name }}</strong></p>
      <p>{{ form().value.category }}</p>
      <p>📍 {{ form().value.area }}</p>
      <p>{{ form().value.about }}</p>
      <p>Call: +91 {{ form().value.phone }}</p>
      <p>WhatsApp: +91 {{ form().value.whatsapp || form().value.phone }}</p>
    </article>
    <div class="register-actions">
      <button class="btn btn--ghost" type="button" (click)="back.emit()">Back to edit</button>
      <button class="btn btn--secondary" type="button" (click)="saveDraft.emit()">Save as draft</button>
      <button class="btn btn--primary" type="button" (click)="goLive.emit()">Go live</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewStepComponent {
  readonly form = input.required<FormGroup>();
  readonly back = output<void>();
  readonly saveDraft = output<void>();
  readonly goLive = output<void>();
}
