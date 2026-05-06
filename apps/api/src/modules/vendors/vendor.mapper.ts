import type { Types } from 'mongoose';
import type { VendorDto } from '../../types/dto.js';
import type { IVendor } from './vendor.schema.js';

export function toVendorDto(v: IVendor & { _id: Types.ObjectId }): VendorDto {
  return {
    id: v._id.toString(),
    name: v.name,
    phone: v.phone,
    whatsapp: v.whatsapp,
    category: v.category,
    area: v.area,
    about: v.about,
    services: v.services,
    photoUrl: v.photoUrl,
    status: v.status,
    createdAt: v.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: v.updatedAt?.toISOString?.(),
  };
}
