import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MediaService } from '../../../core/services/media.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-vendor-info-step',
  standalone: true,
  styleUrl: './vendor-info-step.component.css',
  imports: [ReactiveFormsModule],
  template: `
    <form class="register-form" [formGroup]="form()">
      <div class="photo-upload">
        <label class="photo-upload__zone" [class.photo-upload__zone--busy]="uploading()">
          @if (previewUrl()) {
            <img class="photo-upload__preview" [src]="previewUrl()!" alt="Profile photo preview" />
          } @else {
            <span class="photo-upload__placeholder">📷 Add your photo (optional)</span>
          }
          <input
            class="photo-upload__input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            [disabled]="uploading()"
            (change)="onFileSelected($event)"
          />
        </label>
        <div class="photo-upload__meta">
          @if (uploading()) {
            <p class="muted">Uploading photo…</p>
          } @else {
            <p class="muted">JPG, PNG, or WebP · max 5 MB</p>
          }
          @if (previewUrl() && !uploading()) {
            <button class="btn btn--ghost btn--sm" type="button" (click)="removePhoto()">Remove photo</button>
          }
        </div>
      </div>

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
        <button type="button" class="btn btn--ghost" [disabled]="uploading()" (click)="cancel.emit()">
          Cancel
        </button>
        <div class="register-actions__end">
          <button type="button" class="btn btn--secondary" [disabled]="uploading()" (click)="next.emit()">
            Review
          </button>
        </div>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorInfoStepComponent implements OnInit {
  private readonly media = inject(MediaService);
  private readonly toast = inject(ToastService);

  readonly form = input.required<FormGroup>();
  readonly next = output<void>();
  readonly cancel = output<void>();

  readonly previewUrl = signal<string | null>(null);
  readonly uploading = signal(false);
  private objectPreviewUrl: string | null = null;

  ngOnInit(): void {
    const existing = this.form().get('photoUrl')?.value as string | undefined;
    if (existing?.trim()) {
      this.previewUrl.set(existing.trim());
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    this.revokeObjectPreview();
    this.objectPreviewUrl = URL.createObjectURL(file);
    this.previewUrl.set(this.objectPreviewUrl);
    this.uploading.set(true);

    try {
      const url = await this.media.uploadVendorPhoto(file);
      this.revokeObjectPreview();
      this.objectPreviewUrl = null;
      this.previewUrl.set(url);
      this.form().patchValue({ photoUrl: url });
      this.toast.success('Photo uploaded');
    } catch (err) {
      this.revokeObjectPreview();
      this.objectPreviewUrl = null;
      const saved = (this.form().get('photoUrl')?.value as string | undefined)?.trim();
      this.previewUrl.set(saved || null);
      const message = err instanceof Error ? err.message : 'Photo upload failed.';
      this.toast.error(message);
    } finally {
      this.uploading.set(false);
    }
  }

  removePhoto(): void {
    this.revokeObjectPreview();
    this.objectPreviewUrl = null;
    this.previewUrl.set(null);
    this.form().patchValue({ photoUrl: '' });
  }

  private revokeObjectPreview(): void {
    if (this.objectPreviewUrl) {
      URL.revokeObjectURL(this.objectPreviewUrl);
      this.objectPreviewUrl = null;
    }
  }
}
