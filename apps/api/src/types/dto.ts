export type UserRoleDto = 'customer' | 'vendor';

export interface UserDto {
  id: string;
  phone: string;
  role: UserRoleDto;
  name?: string;
  area?: string;
  createdAt: string;
}

export interface VendorDto {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  category: string;
  area: string;
  about?: string;
  services?: string[];
  photoUrl?: string;
  status: 'draft' | 'live' | 'inactive';
  createdAt: string;
  updatedAt?: string;
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
