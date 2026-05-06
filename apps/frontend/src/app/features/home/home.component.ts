import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CategoryFilterComponent } from './components/category-filter.component';
import { SearchBarComponent } from './components/search-bar.component';
import { VendorGridComponent } from './components/vendor-grid.component';
import { CategoryService } from '../../core/services/category.service';
import { VendorApiService } from '../../core/services/vendor-api.service';
import type { VendorCategory } from '../../core/models/vendor.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SearchBarComponent, CategoryFilterComponent, VendorGridComponent],
  template: `
    <section class="view">
      <header class="page-head">
        <div>
          <h1>Find local services</h1>
          <p class="muted">Yamunanagar</p>
        </div>
      </header>

      <app-search-bar [(query)]="searchQuery" />
      <app-category-filter [categories]="categories" [(selected)]="selectedCategory" />

      <h2 class="section-title">{{ sectionTitle() }}</h2>
      @if (loadError()) {
        <p class="muted">{{ loadError() }}</p>
      }
      <app-vendor-grid [vendors]="vendorsForGrid()" />
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly vendorApi = inject(VendorApiService);
  readonly categories = this.categoryService.list();
  readonly selectedCategory = signal<VendorCategory>('all');
  readonly searchQuery = signal('');
  readonly loadError = signal<string | null>(null);
  readonly vendorsForGrid = computed(() => this.vendorApi.publicVendors());
  readonly sectionTitle = computed(() => this.vendorApi.getSectionLabel(this.selectedCategory()));

  constructor() {
    effect(() => {
      const cat = this.selectedCategory();
      const q = this.searchQuery();
      void this.vendorApi
        .loadPublicVendors(cat, q)
        .then(() => this.loadError.set(null))
        .catch(() =>
          this.loadError.set(
            'Could not load listings. Ensure the API is running and CORS/API URL are configured.',
          ),
        );
    });
  }
}