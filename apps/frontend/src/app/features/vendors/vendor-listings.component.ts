import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SearchBarComponent } from '../home/components/search-bar.component';
import { CategoryFilterComponent } from '../home/components/category-filter.component';
import { VendorGridComponent } from '../home/components/vendor-grid.component';
import { CategoryService } from '../../core/services/category.service';
import { VendorApiService } from '../../core/services/vendor-api.service';
import type { Vendor, VendorCategory } from '../../core/models/vendor.model';
import { SkeletonComponent, type SkeletonLayout } from '../../shared/ui/skeleton.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

const LIST_SKELETON: SkeletonLayout = [['block'], ['block'], ['block'], ['block']];

const CATEGORY_SLUGS = new Set([
  'all',
  'electrician',
  'plumber',
  'gardener',
  'mechanic',
  'photographer',
  'gym-trainer',
  'other',
]);

@Component({
  selector: 'app-vendor-listings',
  standalone: true,
  styleUrl: './vendor-listings.component.css',
  imports: [
    FormsModule,
    RouterLink,
    SearchBarComponent,
    CategoryFilterComponent,
    VendorGridComponent,
    SkeletonComponent,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  template: `
    <section class="view">
      <app-page-header title="Find vendor" subtitle="Search by name, category, or area" />

      <app-search-bar [(query)]="searchQuery" />

      <app-category-filter [categories]="categories" [(selected)]="selectedCategory" />

      <label class="filter-label" for="area-filter">Area / locality</label>
      <input
        id="area-filter"
        class="input"
        type="search"
        placeholder="e.g. Basant Vihar"
        [(ngModel)]="areaQuery"
      />

      <div class="listings-meta">
        <p class="section-title">{{ resultsTitle() }}</p>
        @if (!loading() && total() > 0) {
          <p class="muted listings-count">{{ total() }} found</p>
        }
      </div>

      @if (loadError()) {
        <app-empty-state icon="error" title="Could not load vendors" [description]="loadError()!" />
      }
      @if (loading()) {
        <app-skeleton [layout]="skeletonLayout" />
      } @else {
        <app-vendor-grid [vendors]="vendors()" />
      }

      <a class="btn btn--ghost listings-back" routerLink="/">← Back to home</a>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorListingsComponent {
  private readonly vendorApi = inject(VendorApiService);
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);

  readonly categories = this.categoryService.list();
  readonly selectedCategory = signal<VendorCategory>('all');
  readonly searchQuery = signal('');
  readonly areaQuery = signal('');
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly total = signal(0);
  readonly vendors = signal<Vendor[]>([]);
  readonly skeletonLayout = LIST_SKELETON;

  readonly resultsTitle = computed(() => {
    const cat = this.selectedCategory();
    if (cat !== 'all') {
      return this.vendorApi.getSectionLabel(cat);
    }
    if (this.searchQuery().trim()) {
      return `Results for “${this.searchQuery().trim()}”`;
    }
    return 'All vendors near you';
  });

  constructor() {
    const cat = this.route.snapshot.queryParamMap.get('category');
    if (cat && CATEGORY_SLUGS.has(cat)) {
      this.selectedCategory.set(cat as VendorCategory);
    }
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) {
      this.searchQuery.set(q);
    }
    const area = this.route.snapshot.queryParamMap.get('area');
    if (area) {
      this.areaQuery.set(area);
    }

    effect(() => {
      const category = this.selectedCategory();
      const q = this.searchQuery();
      const area = this.areaQuery();
      this.loading.set(true);
      void this.vendorApi
        .searchVendors({ category, q, area, limit: 50 })
        .then((res) => {
          this.loadError.set(null);
          this.vendors.set(res.items);
          this.total.set(res.total);
        })
        .catch(() => {
          this.loadError.set('Could not load listings. Ensure the API is running.');
          this.vendors.set([]);
          this.total.set(0);
        })
        .finally(() => this.loading.set(false));
    });
  }
}
