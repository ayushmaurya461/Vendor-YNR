export type UserRoleDto = 'customer' | 'vendor';

export interface UserDto {
  id: string;
  phone: string;
  role: UserRoleDto;
  name?: string;
  area?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface VendorServiceDto {
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface VendorDto {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  category: string;
  area: string;
  about?: string;
  services?: VendorServiceDto[];
  photoUrl?: string;
  status: 'draft' | 'live' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewDto {
  id: string;
  vendorId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface VendorStatsDto {
  profileViews: number;
  callsThisWeek: number;
  whatsappsThisWeek: number;
}

export interface VendorListMetaDto {
  items: VendorDto[];
  page: number;
  limit: number;
  total: number;
}
