import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Vendor } from '../../core/models/vendor.model';
import { VendorApiService } from '../../core/services/vendor-api.service';
import { AvatarComponent } from '../../shared/ui/avatar.component';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { getWhatsappUrl } from '../../shared/utils/whatsapp-url.util';

@Component({
  selector: 'app-vendor-detail',
  standalone: true,
  imports: [RouterLink, AvatarComponent, BadgeComponent],
  template: `
    @if (vendor(); as data) {
    <section class="view">
      <header class="page-head">
        <div>
          <h1>Vendor detail</h1>
          <p class="muted">Full profile</p>
        </div>
        <a class="btn btn--secondary" routerLink="/">← Back</a>
      </header>

      <article class="card vendor-hero">
        <app-avatar [name]="data.name" [photoUrl]="data.photoUrl" />
        <div>
          <h2>{{ data.name }}</h2>
          <p>{{ prettyCategory(data.category) }}</p>
          <div class="vendor-meta">
            <app-badge [tone]="data.status === 'live' ? 'success' : 'danger'">
              {{ data.status === 'live' ? '● Available' : '● Currently unavailable' }}
            </app-badge>
            <span class="muted">📍 {{ data.area }}</span>
          </div>
        </div>
      </article>

      @if (data.status === 'live') {
        <div class="detail-ctas">
          <a class="btn btn--secondary" [href]="'tel:+91' + data.phone">◉ Call now</a>
          <a
            class="btn btn--secondary"
            [href]="whatsApp(data.whatsapp)"
            target="_blank"
            rel="noopener"
          >
            💬 WhatsApp
          </a>
        </div>
      }

      <article class="card">
        <p class="section-title">About</p>
        <p>{{ data.about || 'No additional details yet.' }}</p>
      </article>

      <article class="card">
        <p class="section-title">Services offered</p>
        <div class="services">
          @for (service of data.services ?? []; track service) {
            <span class="chip">{{ service }}</span>
          }
        </div>
      </article>

      <article class="card">
        <p class="section-title">Area</p>
        <p>{{ data.area }}</p>
      </article>

      <article class="card">
        <p class="section-title">Phone</p>
        <a [href]="'tel:+91' + data.phone">+91 {{ data.phone }}</a>
      </article>
    </section>
    } @else if (loading()) {
    <section class="view card">
      <p class="muted">Loading vendor…</p>
    </section>
    } @else {
    <section class="view card">
      <p class="muted">Vendor not found or listing is unavailable.</p>
      <a class="btn btn--secondary" routerLink="/">← Back home</a>
    </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly vendorApi = inject(VendorApiService);
  readonly vendor = signal<Vendor | null>(null);
  readonly loading = signal(true);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (params) => {
      const id = params.get('id');
      if (!id) {
        this.vendor.set(null);
        this.loading.set(false);
        return;
      }
      this.loading.set(true);
      this.vendor.set(null);
      const v = await this.vendorApi.fetchVendorById(id);
      this.vendor.set(v);
      if (v) {
        this.vendorApi.recordVendorEvent(v.id, 'view');
      }
      this.loading.set(false);
    });
  }

  prettyCategory(category: string): string {
    return category.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  whatsApp(phone: string): string {
    return getWhatsappUrl(phone, 'Hi, I found you on YNR Local. Are you available?');
  }
}
