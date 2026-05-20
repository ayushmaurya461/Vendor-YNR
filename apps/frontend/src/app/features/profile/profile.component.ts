import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/ui/avatar.component';
import { formatIndianPhone } from '../../shared/utils/phone.util';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  styleUrl: './profile.component.css',
  imports: [CommonModule, FormsModule, AvatarComponent],
  template: `
    @if (auth.user(); as user) {
      <section class="view">
        <header class="page-head">
          <h1>My profile</h1>
          <button class="btn btn--secondary" (click)="editing.update((v) => !v)">{{ editing() ? 'Done' : 'Edit' }}</button>
        </header>

        <article class="card profile-hero">
          <app-avatar [name]="user.name || 'User'" />
          <div>
            <h2>{{ user.name || 'User' }}</h2>
            <p>{{ formatPhone(user.phone) }}</p>
          </div>
        </article>

        <article class="card details-grid">
          <p class="section-title">Account details</p>
          <label>Name</label>
          @if (editing()) {
            <input class="input" [(ngModel)]="name" />
          } @else {
            <strong>{{ user.name }}</strong>
          }
          <label>Phone</label>
          <strong>{{ formatPhone(user.phone) }}</strong>
          <label>Area</label>
          @if (editing()) {
            <input class="input" [(ngModel)]="area" />
          } @else {
            <strong>{{ user.area }}</strong>
          }
          <label>Member since</label>
          <strong>{{ user.createdAt | date: 'MMM y' }}</strong>
        </article>

        <article class="card actions-grid">
          <p class="section-title">Actions</p>
          <div class="actions-row">
            <span>Saved vendors</span>
            <strong>3 saved</strong>
          </div>
          <div class="actions-buttons">
            <button class="btn btn--ghost" (click)="save()">Save profile</button>
            <button class="btn btn--danger" (click)="logout()">Sign out</button>
          </div>
        </article>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly editing = signal(false);
  name = this.auth.user()?.name ?? '';
  area = this.auth.user()?.area ?? '';

  formatPhone(phone: string): string {
    return formatIndianPhone(phone);
  }

  save(): void {
    void this.auth.patchProfile({ name: this.name, area: this.area }).then(() => {
      this.editing.set(false);
    });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
