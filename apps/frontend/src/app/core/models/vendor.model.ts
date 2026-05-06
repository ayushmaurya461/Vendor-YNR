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

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  category: Exclude<VendorCategory, 'all'>;
  area: string;
  about?: string;
  services?: string[];
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
