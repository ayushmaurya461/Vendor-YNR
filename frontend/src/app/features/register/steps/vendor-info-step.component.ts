import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-vendor-info-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form class="register-form" [formGroup]="form()">
      <div class="upload">📷 Upload your photo (optional)</div>
      <h3>Basic info</h3>
      <label>Full name</label>
      <input class="input" formControlName="name" />
      <div class="row two-col">
        <div>
          <label>Category</label>
          <select class="input" formControlName="category">
            <option value="electrician">Electrician</option>
            <option value="plumber">Plumber</option>
            <option value="gardener">Gardener</option>
            <option value="mechanic">Mechanic</option>
            <option value="photographer">Photographer</option>
            <option value="gym-trainer">Gym trainer</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label>Area / locality</label>
          <input class="input" formControlName="area" />
        </div>
      </div>
      <label>About you</label>
      <textarea class="input input--textarea" formControlName="about"></textarea>
      <div class="row two-col">
        <div>
          <label>Phone (for calls)</label>
          <input class="input" formControlName="phone" />
        </div>
        <div>
          <label>WhatsApp number</label>
          <input class="input" formControlName="whatsapp" />
        </div>
      </div>
      <div class="register-actions">
        <button type="button" class="btn btn--secondary" (click)="next.emit()">Review</button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorInfoStepComponent {
  readonly form = input.required<FormGroup>();
  readonly next = output<void>();
}
