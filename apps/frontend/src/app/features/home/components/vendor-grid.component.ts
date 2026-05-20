import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Vendor } from '../../../core/models/vendor.model';
import { AvatarComponent } from '../../../shared/ui/avatar.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { getWhatsappUrl } from '../../../shared/utils/whatsapp-url.util';
import { IconComponent } from '../../../shared/ui/icon.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';

@Component({
  selector: 'app-vendor-grid',
  standalone: true,
  styleUrl: './vendor-grid.component.css',
  imports: [RouterLink, AvatarComponent, BadgeComponent, IconComponent, EmptyStateComponent],
  template: `
    <section class="vendor-grid">
      @for (vendor of vendors(); track vendor.id) {
        <article class="card vendor-card">
          <a class="vendor-card__top" [routerLink]="['/vendors', vendor.id]">
            <app-avatar [name]="vendor.name" [photoUrl]="vendor.photoUrl" />
            <div>
              <h3>{{ vendor.name }}</h3>
              <p class="muted">{{ label(vendor.category) }}</p>
              <p class="meta-line muted">
                <app-icon name="location" [size]="16" />
                <span>{{ vendor.area }}</span>
              </p>
            </div>
          </a>
          <app-badge [tone]="vendor.status === 'live' ? 'success' : 'danger'">
            {{ vendor.status === 'live' ? '● Available' : '● Busy' }}
          </app-badge>
          <div class="vendor-card__actions">
            <a class="btn btn--secondary" [href]="'tel:+91' + vendor.phone">
              <app-icon name="phone" [size]="18" />
              <span>Call</span>
            </a>
            <a
              class="btn btn--secondary"
              [href]="whatsApp(vendor.whatsapp)"
              target="_blank"
              rel="noopener"
            >
              <app-icon name="whatsapp" [size]="20" />
              <span>WhatsApp</span>
            </a>
          </div>
        </article>
      } @empty {
        <app-empty-state
          [spanFullWidth]="true"
          icon="vendors"
          title="No nearby vendors found"
          description="Try another category or area, or check back later."
        />
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorGridComponent {
  readonly vendors = input.required<Vendor[]>();

  label(category: Vendor['category']): string {
    return category.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  whatsApp(phone: string): string {
    return getWhatsappUrl(phone);
  }
}
