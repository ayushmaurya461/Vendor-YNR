import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AvatarComponent } from '../../../shared/ui/avatar.component';

@Component({
  selector: 'app-review-step',
  standalone: true,
  styleUrl: './review-step.component.css',
  imports: [AvatarComponent],
  template: `
    <article class="card">
      <div class="review-card__head">
        <p class="section-title">Review listing</p>
        <button class="btn btn--secondary" type="button" (click)="back.emit()">Edit listing</button>
      </div>
      <div class="review-hero">
        <app-avatar [name]="form().value.name || 'Vendor'" [photoUrl]="form().value.photoUrl || undefined" />
        <div>
          <p><strong>{{ form().value.name }}</strong></p>
          <p>{{ form().value.category }}</p>
          <p>📍 {{ form().value.area }}</p>
        </div>
      </div>
      @if (form().value.about) {
        <p>{{ form().value.about }}</p>
      }
      <p>Call: +91 {{ form().value.phone }}</p>
      <p>WhatsApp: +91 {{ form().value.whatsapp || form().value.phone }}</p>
    </article>
    <div class="register-actions">
      <button class="btn btn--ghost" type="button" (click)="cancel.emit()">Cancel</button>
      <div class="register-actions__end">
        <button class="btn btn--secondary" type="button" (click)="saveDraft.emit()">Save as draft</button>
        <button class="btn btn--primary" type="button" (click)="goLive.emit()">Go live</button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewStepComponent {
  readonly form = input.required<FormGroup>();
  readonly back = output<void>();
  readonly cancel = output<void>();
  readonly saveDraft = output<void>();
  readonly goLive = output<void>();
}
