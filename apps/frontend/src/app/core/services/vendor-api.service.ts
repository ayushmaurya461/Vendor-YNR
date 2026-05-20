import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  Category,
  HomeFeed,
  HomeCategorySection,
  Vendor,
  VendorCategory,
  VendorListFilters,
  VendorListResult,
  VendorReview,
  VendorServiceItem,
  VendorStats,
} from '../models/vendor.model';

interface VendorServiceDto {
  name: string;
  description?: string;
  imageUrl?: string;
}

interface VendorDto {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  category: string;
  area: string;
  about?: string;
  services?: (string | VendorServiceDto)[];
  photoUrl?: string;
  status: Vendor['status'];
  createdAt: string;
  updatedAt?: string;
}

interface ReviewDto {
  id: string;
  vendorId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

function mapServices(services?: (string | VendorServiceDto)[]): VendorServiceItem[] | undefined {
  if (!services?.length) {
    return undefined;
  }
  const items = services
    .map((entry) => {
      if (typeof entry === 'string') {
        const name = entry.trim();
        return name.length > 0 ? { name } : null;
      }
      const name = entry.name?.trim();
      if (!name) {
        return null;
      }
      return {
        name,
        description: entry.description?.trim() || undefined,
        imageUrl: entry.imageUrl?.trim() || undefined,
      };
    })
    .filter((item): item is VendorServiceItem => item !== null);
  return items.length > 0 ? items : undefined;
}

function mapReviewDto(d: ReviewDto): VendorReview {
  return {
    id: d.id,
    vendorId: d.vendorId,
    authorName: d.authorName,
    rating: d.rating,
    comment: d.comment,
    createdAt: d.createdAt,
  };
}

interface VendorListPayload {
  items: VendorDto[];
  page: number;
  limit: number;
  total: number;
}

const CATEGORY_SLUGS = new Set<string>([
  'electrician',
  'plumber',
  'gardener',
  'mechanic',
  'photographer',
  'gym-trainer',
  'other',
]);

function mapVendorDto(d: VendorDto): Vendor {
  const category = CATEGORY_SLUGS.has(d.category)
    ? (d.category as Vendor['category'])
    : 'other';
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    whatsapp: d.whatsapp,
    category,
    area: d.area,
    about: d.about,
    services: mapServices(d.services),
    photoUrl: d.photoUrl,
    status: d.status,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

@Injectable({ providedIn: 'root' })
export class VendorApiService {
  private readonly http = inject(HttpClient);

  private readonly publicVendorsState = signal<Vendor[]>([]);
  private readonly myVendorState = signal<Vendor | null>(null);
  private readonly myListingsState = signal<Vendor[]>([]);
  private readonly dashboardStatsState = signal<VendorStats>({
    profileViews: 0,
    callsThisWeek: 0,
    whatsappsThisWeek: 0,
  });

  readonly categories: Category[] = [
    { id: 'all', slug: 'all', label: 'All', icon: '⭐', isActive: true },
    { id: 'electrician', slug: 'electrician', label: 'Electrical', icon: '⚡', isActive: true },
    { id: 'plumber', slug: 'plumber', label: 'Plumber', icon: '🔧', isActive: true },
    { id: 'gardener', slug: 'gardener', label: 'Gardener', icon: '🌿', isActive: true },
    { id: 'photographer', slug: 'photographer', label: 'Camera', icon: '📷', isActive: true },
    { id: 'mechanic', slug: 'mechanic', label: 'Mechanic', icon: '🛠️', isActive: true },
    { id: 'gym-trainer', slug: 'gym-trainer', label: 'Gym', icon: '🏋️', isActive: true },
  ];

  readonly publicVendors = this.publicVendorsState.asReadonly();
  readonly myVendor = this.myVendorState.asReadonly();
  readonly myListings = this.myListingsState.asReadonly();
  readonly dashboardStats = this.dashboardStatsState.asReadonly();

  hasVendorListing(): boolean {
    return this.myListingsState().length > 0 || this.myVendorState() !== null;
  }

  async loadHomeFeed(): Promise<HomeFeed> {
    const res = await firstValueFrom(
      this.http.get<{
        success: boolean;
        data: {
          topVendors: VendorDto[];
          byCategory: { category: string; items: VendorDto[] }[];
        };
      }>(`${environment.apiUrl}/vendors/home`),
    );
    return {
      topVendors: res.data.topVendors.map(mapVendorDto),
      byCategory: res.data.byCategory
        .map((section) => ({
          category: normalizeCategorySlug(section.category),
          items: section.items.map(mapVendorDto),
        }))
        .filter(
          (section): section is HomeCategorySection =>
            section.category !== 'all' && section.items.length > 0,
        ),
    };
  }

  async searchVendors(filters: VendorListFilters): Promise<VendorListResult> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const params: {
      page: string;
      limit: string;
      categories?: string;
      category?: string;
      q?: string;
      area?: string;
    } = {
      page: String(page),
      limit: String(limit),
    };

    if (filters.categories?.length) {
      const slugs = filters.categories.filter((c) => c !== 'all');
      if (slugs.length) {
        params.categories = slugs.join(',');
      }
    } else if (filters.category && filters.category !== 'all') {
      params.category = filters.category;
    }

    const q = filters.q?.trim();
    if (q) {
      params.q = q;
    }
    const area = filters.area?.trim();
    if (area) {
      params.area = area;
    }

    const res = await firstValueFrom(
      this.http.get<{ success: boolean; data: VendorListPayload }>(`${environment.apiUrl}/vendors`, {
        params,
      }),
    );
    const result: VendorListResult = {
      items: res.data.items.map(mapVendorDto),
      page: res.data.page,
      limit: res.data.limit,
      total: res.data.total,
    };
    this.publicVendorsState.set(result.items);
    return result;
  }

  /** @deprecated Prefer searchVendors — kept for simple call sites */
  async loadPublicVendors(category: VendorCategory, q: string, area = ''): Promise<VendorListResult> {
    return this.searchVendors({ category, q, area });
  }

  async fetchVendorById(id: string): Promise<Vendor | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; data: VendorDto }>(`${environment.apiUrl}/vendors/${id}`),
      );
      return mapVendorDto(res.data);
    } catch {
      return null;
    }
  }

  async fetchVendorReviews(vendorId: string): Promise<VendorReview[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; data: { items: ReviewDto[] } }>(
          `${environment.apiUrl}/vendors/${vendorId}/reviews`,
        ),
      );
      return res.data.items.map(mapReviewDto);
    } catch {
      return [];
    }
  }

  async fetchSavedVendors(): Promise<{ ids: string[]; items: Vendor[] }> {
    const res = await firstValueFrom(
      this.http.get<{ success: boolean; data: { ids: string[]; items: VendorDto[] } }>(
        `${environment.apiUrl}/users/me/saved-vendors`,
      ),
    );
    return {
      ids: res.data.ids,
      items: res.data.items.map(mapVendorDto),
    };
  }

  async saveVendor(vendorId: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/users/me/saved-vendors/${vendorId}`, {}),
    );
  }

  async unsaveVendor(vendorId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${environment.apiUrl}/users/me/saved-vendors/${vendorId}`),
    );
  }

  async submitVendorReview(
    vendorId: string,
    body: { rating: number; comment: string },
  ): Promise<VendorReview> {
    const res = await firstValueFrom(
      this.http.post<{ success: boolean; data: ReviewDto }>(
        `${environment.apiUrl}/vendors/${vendorId}/reviews`,
        body,
      ),
    );
    return mapReviewDto(res.data);
  }

  /** GET /vendors/me/listings — returns [] if none or not a vendor. */
  async fetchMyListingsSilently(): Promise<Vendor[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; data: { items: VendorDto[] } }>(
          `${environment.apiUrl}/vendors/me/listings`,
        ),
      );
      const items = res.data.items.map(mapVendorDto);
      this.myListingsState.set(items);
      if (items.length > 0) {
        this.myVendorState.set(items[0]);
      } else {
        this.myVendorState.set(null);
      }
      return items;
    } catch {
      this.myListingsState.set([]);
      return [];
    }
  }

  /** GET /vendors/me — returns null if no listing (404). */
  async fetchMyListingSilently(): Promise<Vendor | null> {
    const listings = await this.fetchMyListingsSilently();
    return listings[0] ?? null;
  }

  /** Load vendor listings and dashboard stats for the primary (most recent) listing. */
  async refreshMyDashboard(): Promise<void> {
    const res = await firstValueFrom(
      this.http.get<{ success: boolean; data: { items: VendorDto[] } }>(
        `${environment.apiUrl}/vendors/me/listings`,
      ),
    );
    const items = res.data.items.map(mapVendorDto);
    this.myListingsState.set(items);
    if (items.length === 0) {
      this.myVendorState.set(null);
      this.dashboardStatsState.set({
        profileViews: 0,
        callsThisWeek: 0,
        whatsappsThisWeek: 0,
      });
      return;
    }

    const primary = items[0];
    this.myVendorState.set(primary);

    const statsRes = await firstValueFrom(
      this.http.get<{ success: boolean; data: VendorStats }>(
        `${environment.apiUrl}/vendors/${primary.id}/stats`,
      ),
    );
    this.dashboardStatsState.set(statsRes.data);
  }

  async createVendor(payload: {
    category: string;
    name: string;
    area: string;
    phone: string;
    whatsapp?: string;
    about?: string;
    services?: VendorServiceItem[];
    photoUrl?: string;
    status: Vendor['status'];
  }): Promise<Vendor> {
    const body = {
      category: payload.category,
      name: payload.name,
      area: payload.area,
      phone: payload.phone,
      whatsapp: payload.whatsapp ?? payload.phone,
      about: payload.about,
      services: payload.services,
      photoUrl: payload.photoUrl,
      status: payload.status,
    };
    const res = await firstValueFrom(
      this.http.post<{ success: boolean; data: VendorDto }>(`${environment.apiUrl}/vendors`, body),
    );
    const v = mapVendorDto(res.data);
    this.myVendorState.set(v);
    this.myListingsState.update((rows) => [v, ...rows.filter((row) => row.id !== v.id)]);
    return v;
  }

  async updateVendorStatus(vendorId: string, status: Vendor['status']): Promise<Vendor> {
    const res = await firstValueFrom(
      this.http.patch<{ success: boolean; data: VendorDto }>(
        `${environment.apiUrl}/vendors/${vendorId}/status`,
        { status },
      ),
    );
    const v = mapVendorDto(res.data);
    this.myVendorState.update((current) => (current?.id === vendorId ? v : current));
    this.myListingsState.update((rows) => rows.map((row) => (row.id === vendorId ? v : row)));
    return v;
  }

  async patchVendorListing(
    vendorId: string,
    patch: Partial<
      Pick<Vendor, 'name' | 'phone' | 'whatsapp' | 'category' | 'area' | 'about' | 'services' | 'photoUrl'>
    >,
  ): Promise<Vendor> {
    const res = await firstValueFrom(
      this.http.patch<{ success: boolean; data: VendorDto }>(
        `${environment.apiUrl}/vendors/${vendorId}`,
        patch,
      ),
    );
    const v = mapVendorDto(res.data);
    this.myVendorState.update((current) => (current?.id === vendorId ? v : current));
    this.myListingsState.update((rows) => rows.map((row) => (row.id === vendorId ? v : row)));
    return v;
  }

  recordVendorEvent(vendorId: string, type: 'view' | 'call' | 'whatsapp'): void {
    void firstValueFrom(
      this.http.post(`${environment.apiUrl}/vendors/${vendorId}/events`, { type }),
    ).catch(() => undefined);
  }

  getSectionLabel(category: VendorCategory): string {
    if (category === 'all') {
      return 'Vendors near you';
    }
    const categoryLabel = this.categories.find((c) => c.slug === category)?.label ?? 'Vendors';
    return `${categoryLabel} near you`;
  }

  getCategoryLabel(category: VendorCategory): string {
    return this.categories.find((c) => c.slug === category)?.label ?? category;
  }
}

function normalizeCategorySlug(slug: string): VendorCategory {
  return CATEGORY_SLUGS.has(slug) ? (slug as VendorCategory) : 'other';
}
