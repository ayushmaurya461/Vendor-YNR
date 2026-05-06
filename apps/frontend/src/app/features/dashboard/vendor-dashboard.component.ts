import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { VendorApiService } from '../../core/services/vendor-api.service';
import { StatCardComponent } from '../../shared/ui/stat-card.component';
import { AvatarComponent } from '../../shared/ui/avatar.component';
import { BadgeComponent } from '../../shared/ui/badge.component';

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [RouterLink, StatCardComponent, AvatarComponent, BadgeComponent],
  template: `
    <section class="view">
      <header class="page-head">
        <div>
          <h1>Vendor dashboard</h1>
          <p class="muted">{{ auth.user()?.name }}</p>
        </div>
        <a class="btn btn--secondary" routerLink="/register">Edit listing</a>
      </header>

      @if (loadError()) {
        <p class="muted">{{ loadError() }}</p>
      }

      <section class="stats">
        <app-stat-card label="Profile views" [value]="stats().profileViews" />
        <app-stat-card label="Calls this week" [value]="stats().callsThisWeek" />
        <app-stat-card label="WhatsApps" [value]="stats().whatsappsThisWeek" />
      </section>

      <article class="card toggle-row">
        <div>
          <h3>Listing active</h3>
          <p class="muted">Customers can find and contact you</p>
        </div>
        <button
          class="toggle"
          type="button"
          [class.toggle--on]="isActive()"
          [disabled]="toggleBusy() || !vendor()"
          (click)="toggleActive()"
        ></button>
      </article>

      @if (vendor(); as data) {
        <article class="card vendor-card">
          <p class="muted">Your listing preview</p>
          <div class="vendor-card__top">
            <app-avatar [name]="data.name" [photoUrl]="data.photoUrl" />
            <div>
              <h3>{{ data.name }}</h3>
              <p>{{ data.category }}</p>
              <p class="muted">📍 {{ data.area }}</p>
            </div>
          </div>
          <app-badge [tone]="isActive() ? 'success' : 'danger'">{{ isActive() ? '● Available' : '● Inactive' }}</app-badge>
        </article>
      } @else {
        <article class="card">
          <p class="muted">No listing found yet. Use Register listing to create one.</p>
        </article>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorDashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly vendorApi = inject(VendorApiService);
  readonly loadError = signal<string | null>(null);
  readonly toggleBusy = signal(false);
  readonly stats = computed(() => this.vendorApi.dashboardStats());
  readonly vendor = computed(() => this.vendorApi.myVendor());
  readonly isActive = computed(() => this.vendorApi.myVendor()?.status === 'live');

  ngOnInit(): void {
    void this.vendorApi.refreshMyDashboard().catch(() => {
      this.loadError.set(
        'Could not load your dashboard. Check that you are signed in as a vendor and the API is running.',
      );
    });
  }

  toggleActive(): void {
    const v = this.vendorApi.myVendor();
    if (!v || this.toggleBusy()) {
      return;
    }
    const next: 'live' | 'inactive' = v.status === 'live' ? 'inactive' : 'live';
    this.toggleBusy.set(true);
    void this.vendorApi
      .updateVendorStatus(v.id, next)
      .then(() => this.vendorApi.refreshMyDashboard())
      .catch(() => {
        this.loadError.set('Could not update listing status.');
      })
      .finally(() => this.toggleBusy.set(false));
  }
}
