import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Category, Vendor, VendorCategory, VendorStats } from '../models/vendor.model';

interface VendorDto {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  category: string;
  area: string;
  about?: string;
  services?: string[];
  photoUrl?: string;
  status: Vendor['status'];
  createdAt: string;
  updatedAt?: string;
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
    services: d.services,
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
  readonly dashboardStats = this.dashboardStatsState.asReadonly();

  async loadPublicVendors(category: VendorCategory, q: string): Promise<void> {
    let params: Record<string, string> = {};
    if (category !== 'all') {
      params = { ...params, category };
    }
    const trimmed = q.trim();
    if (trimmed) {
      params = { ...params, q: trimmed };
    }

    const res = await firstValueFrom(
      this.http.get<{ success: boolean; data: VendorListPayload }>(`${environment.apiUrl}/vendors`, {
        params,
      }),
    );
    this.publicVendorsState.set(res.data.items.map(mapVendorDto));
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

  /** GET /vendors/me — returns null if no listing (404). */
  async fetchMyListingSilently(): Promise<Vendor | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; data: VendorDto }>(`${environment.apiUrl}/vendors/me`),
      );
      const v = mapVendorDto(res.data);
      this.myVendorState.set(v);
      return v;
    } catch {
      return null;
    }
  }

  /** Load current vendor listing and dashboard stats (auth required). */
  async refreshMyDashboard(): Promise<void> {
    const res = await firstValueFrom(
      this.http.get<{ success: boolean; data: VendorDto }>(`${environment.apiUrl}/vendors/me`),
    );
    const v = mapVendorDto(res.data);
    this.myVendorState.set(v);

    const statsRes = await firstValueFrom(
      this.http.get<{ success: boolean; data: VendorStats }>(`${environment.apiUrl}/vendors/${v.id}/stats`),
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
    services?: string[];
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
    return `${categoryLabel.toUpperCase()} NEAR YOU`;
  }
}
