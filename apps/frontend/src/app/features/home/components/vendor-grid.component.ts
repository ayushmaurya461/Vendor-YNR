import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Vendor } from '../../../core/models/vendor.model';
import { AvatarComponent } from '../../../shared/ui/avatar.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { getWhatsappUrl } from '../../../shared/utils/whatsapp-url.util';

@Component({
  selector: 'app-vendor-grid',
  standalone: true,
  styleUrl: './vendor-grid.component.css',
  imports: [RouterLink, AvatarComponent, BadgeComponent],
  template: `
    <section class="vendor-grid">
      @for (vendor of vendors(); track vendor.id) {
        <article class="card vendor-card">
          <a class="vendor-card__top" [routerLink]="['/vendors', vendor.id]">
            <app-avatar [name]="vendor.name" [photoUrl]="vendor.photoUrl" />
            <div>
              <h3>{{ vendor.name }}</h3>
              <p class="muted">{{ label(vendor.category) }}</p>
              <p class="muted">📍 {{ vendor.area }}</p>
            </div>
          </a>
          <app-badge [tone]="vendor.status === 'live' ? 'success' : 'danger'">
            {{ vendor.status === 'live' ? '● Available' : '● Busy' }}
          </app-badge>
          <div class="vendor-card__actions">
            <a class="btn btn--secondary" [href]="'tel:+91' + vendor.phone">◉ Call</a>
            <a class="btn btn--secondary" [href]="whatsApp(vendor.whatsapp)" target="_blank" rel="noopener">💬 WhatsApp</a>
          </div>
        </article>
      } @empty {
        <p class="muted">no nearby vendors found</p>
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
