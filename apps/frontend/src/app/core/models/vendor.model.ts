export type VendorStatus = 'draft' | 'live' | 'inactive';

export type VendorCategory =
  | 'all'
  | 'electrician'
  | 'plumber'
  | 'gardener'
  | 'mechanic'
  | 'photographer'
  | 'gym-trainer'
  | 'other';

export interface VendorServiceItem {
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface VendorReview {
  id: string;
  vendorId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  category: Exclude<VendorCategory, 'all'>;
  area: string;
  about?: string;
  services?: VendorServiceItem[];
  photoUrl?: string;
  status: VendorStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  slug: VendorCategory;
  label: string;
  icon: string;
  isActive: boolean;
}

export interface VendorStats {
  profileViews: number;
  callsThisWeek: number;
  whatsappsThisWeek: number;
}

export interface HomeCategorySection {
  category: Exclude<VendorCategory, 'all'>;
  items: Vendor[];
}

export interface HomeFeed {
  topVendors: Vendor[];
  byCategory: HomeCategorySection[];
}

export interface VendorListFilters {
  category?: VendorCategory;
  categories?: VendorCategory[];
  q?: string;
  area?: string;
  page?: number;
  limit?: number;
}

export interface VendorListResult {
  items: Vendor[];
  page: number;
  limit: number;
  total: number;
}
