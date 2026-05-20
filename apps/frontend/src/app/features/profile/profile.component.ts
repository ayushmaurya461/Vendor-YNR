import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { formatIndianPhone } from '../../shared/utils/phone.util';
import { Router, RouterLink } from '@angular/router';
import { SavedVendorsService } from '../../core/services/saved-vendors.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PhotoUploadComponent } from '../../shared/ui/photo-upload.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  styleUrl: './profile.component.css',
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent, PhotoUploadComponent],
  template: `
    @if (auth.user(); as user) {
      <section class="view">
        <app-page-header title="My profile" />

        <article class="card profile-hero">
          <div class="profile-hero__photo">
            <app-photo-upload
              variant="round"
              scope="profile"
              placeholder="Add photo"
              altText="Your profile photo"
              [disabled]="photoSaving()"
              [(photoUrl)]="photoDraft"
              (photoUrlChange)="onPhotoChange($event)"
            />
            @if (photoSaving()) {
              <p class="muted profile-hero__photo-status">Saving photo…</p>
            }
          </div>
          <div class="profile-hero__info">
            <h2>{{ user.name || 'User' }}</h2>
            <p>{{ formatPhone(user.phone) }}</p>
          </div>
        </article>

        <article class="card details-grid">
          <div class="details-head">
            <p class="section-title">Account details</p>
            @if (!editing()) {
              <button class="btn btn--ghost btn--sm" type="button" (click)="startEdit(user)">Edit</button>
            }
          </div>

          <label for="profile-name">Name</label>
          @if (editing()) {
            <input id="profile-name" class="input" [(ngModel)]="name" />
          } @else {
            <strong>{{ user.name || '—' }}</strong>
          }

          <label>Phone</label>
          <strong>{{ formatPhone(user.phone) }}</strong>

          <label for="profile-area">Area</label>
          @if (editing()) {
            <input id="profile-area" class="input" [(ngModel)]="area" />
          } @else {
            <strong>{{ user.area || '—' }}</strong>
          }

          <label>Member since</label>
          <strong>{{ user.createdAt | date: 'MMM y' }}</strong>

          @if (editing()) {
            <div class="details-actions">
              <button class="btn btn--primary" type="button" [disabled]="saving()" (click)="save()">
                {{ saving() ? 'Saving…' : 'Save changes' }}
              </button>
              <button class="btn btn--secondary" type="button" [disabled]="saving()" (click)="cancelEdit(user)">
                Cancel
              </button>
            </div>
          }
        </article>

        <article class="card actions-card">
          <p class="section-title actions-card__title">Actions</p>
          <a class="actions-card__row actions-card__link" routerLink="/saved">
            <span class="muted">Saved vendors</span>
            <strong>{{ savedCount() }} saved</strong>
          </a>
          <button class="btn btn--danger actions-card__logout" type="button" (click)="logout()">
            Sign out
          </button>
        </article>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly savedVendors = inject(SavedVendorsService);
  private readonly router = inject(Router);

  readonly savedCount = this.savedVendors.savedCount;
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly photoSaving = signal(false);
  readonly photoDraft = signal('');
  name = '';
  area = '';

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (!user) {
        return;
      }
      if (!this.editing()) {
        this.photoDraft.set(user.photoUrl ?? '');
      }
    });
  }

  formatPhone(phone: string): string {
    return formatIndianPhone(phone);
  }

  startEdit(user: User): void {
    this.name = user.name ?? '';
    this.area = user.area ?? '';
    this.editing.set(true);
  }

  cancelEdit(user: User): void {
    this.name = user.name ?? '';
    this.area = user.area ?? '';
    this.photoDraft.set(user.photoUrl ?? '');
    this.editing.set(false);
  }

  save(): void {
    const trimmedName = this.name.trim();
    const trimmedArea = this.area.trim();
    if (!trimmedName || !trimmedArea) {
      return;
    }
    this.saving.set(true);
    void this.auth
      .patchProfile({ name: trimmedName, area: trimmedArea })
      .then(() => this.editing.set(false))
      .finally(() => this.saving.set(false));
  }

  onPhotoChange(url: string): void {
    const current = this.auth.user()?.photoUrl ?? '';
    if (url === current) {
      return;
    }
    this.photoSaving.set(true);
    void this.auth.patchProfile({ photoUrl: url }).finally(() => this.photoSaving.set(false));
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
