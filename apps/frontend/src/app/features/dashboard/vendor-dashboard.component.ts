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
import { ToggleComponent } from '../../shared/ui/toggle.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  styleUrl: './vendor-dashboard.component.css',
  imports: [
    RouterLink,
    StatCardComponent,
    AvatarComponent,
    BadgeComponent,
    ToggleComponent,
    PageHeaderComponent,
    IconComponent,
    EmptyStateComponent,
  ],
  template: `
    <section class="view">
      <app-page-header title="Vendor dashboard" [subtitle]="auth.user()?.name" />

      @if (loadError()) {
        <p class="muted">{{ loadError() }}</p>
      }

      <section class="stats">
        <app-stat-card label="Profile views" [value]="stats().profileViews" />
        <app-stat-card label="Calls this week" [value]="stats().callsThisWeek" />
        <app-stat-card label="WhatsApps" [value]="stats().whatsappsThisWeek" />
      </section>

      <article class="card">
        <app-toggle
          [checked]="isActive()"
          [disabled]="toggleBusy() || !vendor()"
          ariaLabel="Listing active"
          (checkedChange)="onListingActiveChange($event)"
        >
          <h3>Listing active</h3>
          <p class="muted">Customers can find and contact you</p>
        </app-toggle>
      </article>

      @if (listings().length > 0) {
        <div class="dashboard-listings-head">
          <p class="section-title">Your listings</p>
          <a class="btn btn--primary" routerLink="/register" [queryParams]="{ new: '1' }">Add another listing</a>
        </div>

        @for (listing of listings(); track listing.id) {
          <article class="card vendor-card">
            <div class="vendor-preview__head">
              <p class="muted">Listing preview</p>
              <a class="btn btn--secondary" routerLink="/register" [queryParams]="{ listingId: listing.id }">
                Edit listing
              </a>
            </div>
            <div class="vendor-card__top">
              <app-avatar [name]="listing.name" [photoUrl]="listing.photoUrl" />
              <div>
                <h3>{{ listing.name }}</h3>
                <p>{{ listing.category }}</p>
                <p class="meta-line muted">
                  <app-icon name="location" [size]="16" />
                  <span>{{ listing.area }}</span>
                </p>
              </div>
            </div>
            <app-badge [tone]="listing.status === 'live' ? 'success' : 'danger'">
              {{ listing.status === 'live' ? '● Available' : listing.status === 'draft' ? '● Draft' : '● Inactive' }}
            </app-badge>
          </article>
        }
      } @else {
        <app-empty-state
          icon="info"
          title="No listing found yet"
          description="Use Register listing to create your vendor profile."
        >
          <a class="btn btn--primary" routerLink="/register">Register listing</a>
        </app-empty-state>
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
  readonly listings = computed(() => this.vendorApi.myListings());
  readonly vendor = computed(() => this.vendorApi.myVendor());
  readonly isActive = computed(() => this.vendorApi.myVendor()?.status === 'live');

  ngOnInit(): void {
    void this.vendorApi.refreshMyDashboard().catch(() => {
      this.loadError.set(
        'Could not load your dashboard. Check that you are signed in as a vendor and the API is running.',
      );
    });
  }

  onListingActiveChange(active: boolean): void {
    const v = this.vendorApi.myVendor();
    if (!v || this.toggleBusy()) {
      return;
    }
    const next: 'live' | 'inactive' = active ? 'live' : 'inactive';
    if (next === v.status) {
      return;
    }
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
