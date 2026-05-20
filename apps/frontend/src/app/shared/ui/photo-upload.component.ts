import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { MediaService, type PhotoUploadScope } from '../../core/services/media.service';

@Component({
  selector: 'app-photo-upload',
  standalone: true,
  styleUrl: './photo-upload.component.css',
  template: `
    <div class="photo-upload" [class.photo-upload--round]="variant() === 'round'">
      <label class="photo-upload__zone" [class.photo-upload__zone--busy]="uploading()">
        @if (previewUrl()) {
          <img class="photo-upload__preview" [src]="previewUrl()!" [alt]="altText()" />
        } @else {
          <span class="photo-upload__placeholder">{{ placeholder() }}</span>
        }
        <input
          class="photo-upload__input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          [disabled]="uploading() || disabled()"
          (change)="onFileSelected($event)"
        />
      </label>
      @if (variant() !== 'round') {
        <div class="photo-upload__meta">
          @if (uploading()) {
            <p class="muted">Uploading photo…</p>
          } @else {
            <p class="muted">JPG, PNG, or WebP · max 5 MB</p>
          }
          @if (previewUrl() && !uploading() && !disabled()) {
            <button class="btn btn--ghost btn--sm" type="button" (click)="removePhoto()">Remove</button>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoUploadComponent implements OnInit, OnDestroy {
  private readonly media = inject(MediaService);
  private readonly toast = inject(ToastService);

  readonly photoUrl = model<string>('');
  readonly scope = input<PhotoUploadScope>('profile');
  readonly variant = input<'default' | 'round'>('default');
  readonly placeholder = input('Add profile photo');
  readonly altText = input('Profile photo');
  readonly disabled = input(false);

  readonly previewUrl = signal<string | null>(null);
  readonly uploading = signal(false);

  private objectPreviewUrl: string | null = null;

  ngOnInit(): void {
    const existing = this.photoUrl().trim();
    if (existing) {
      this.previewUrl.set(existing);
    }
  }

  ngOnDestroy(): void {
    this.revokeObjectPreview();
  }

  async onFileSelected(event: Event): Promise<void> {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file) {
      return;
    }

    this.revokeObjectPreview();
    this.objectPreviewUrl = URL.createObjectURL(file);
    this.previewUrl.set(this.objectPreviewUrl);
    this.uploading.set(true);

    try {
      const url = await this.media.uploadPhoto(file, this.scope());
      this.revokeObjectPreview();
      this.objectPreviewUrl = null;
      this.previewUrl.set(url);
      this.photoUrl.set(url);
      this.toast.success('Photo uploaded');
    } catch (err) {
      this.revokeObjectPreview();
      this.objectPreviewUrl = null;
      const saved = this.photoUrl().trim();
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
    this.photoUrl.set('');
  }

  private revokeObjectPreview(): void {
    if (this.objectPreviewUrl) {
      URL.revokeObjectURL(this.objectPreviewUrl);
      this.objectPreviewUrl = null;
    }
  }
}
