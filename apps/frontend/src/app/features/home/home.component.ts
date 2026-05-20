import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VendorGridComponent } from './components/vendor-grid.component';
import { VendorApiService } from '../../core/services/vendor-api.service';
import type { HomeCategorySection, Vendor } from '../../core/models/vendor.model';
import { SkeletonComponent, type SkeletonLayout } from '../../shared/ui/skeleton.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

const HOME_SKELETON: SkeletonLayout = [['block'], ['block'], ['block']];

@Component({
  selector: 'app-home',
  standalone: true,
  styleUrl: './home.component.css',
  imports: [RouterLink, VendorGridComponent, SkeletonComponent, PageHeaderComponent, EmptyStateComponent],
  template: `
    <section class="view">
      <app-page-header title="Find local services" />

      @if (loadError()) {
        <app-empty-state icon="error" title="Could not load home feed" [description]="loadError()!" />
      }
      @if (loading()) {
        <app-skeleton [layout]="skeletonLayout" />
      } @else {
        <section class="home-block">
          <div class="home-block__head">
            <h2 class="section-title">Top vendors near you</h2>
            <a class="home-block__link" routerLink="/vendors">Find vendors</a>
          </div>
          <app-vendor-grid [vendors]="topVendors()" />
        </section>

        @for (section of categorySections(); track section.category) {
          <section class="home-block">
            <div class="home-block__head">
              <h2 class="section-title">{{ categoryTitle(section) }}</h2>
              <a
                class="home-block__link"
                [routerLink]="['/vendors']"
                [queryParams]="{ category: section.category }"
              >
                See all
              </a>
            </div>
            <app-vendor-grid [vendors]="section.items" />
          </section>
        }

        <div class="home-cta">
          <a class="btn btn--primary" routerLink="/vendors">Find a vendor</a>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly vendorApi = inject(VendorApiService);

  readonly skeletonLayout = HOME_SKELETON;
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly topVendors = signal<Vendor[]>([]);
  readonly categorySections = signal<HomeCategorySection[]>([]);

  constructor() {
    void this.load();
  }

  categoryTitle(section: HomeCategorySection): string {
    return this.vendorApi.getCategoryLabel(section.category);
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const feed = await this.vendorApi.loadHomeFeed();
      this.topVendors.set(feed.topVendors);
      this.categorySections.set(feed.byCategory);
    } catch {
      this.loadError.set('Could not load home feed. Ensure the API is running.');
      this.topVendors.set([]);
      this.categorySections.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
