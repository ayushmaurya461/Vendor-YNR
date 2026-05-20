import { Schema, Types, model } from 'mongoose';
import type { IVendorServiceItem } from './vendor-service.util.js';

export interface IVendor {
  userId: Types.ObjectId;
  name: string;
  phone: string;
  whatsapp: string;
  category: string;
  area: string;
  about?: string;
  services?: IVendorServiceItem[];
  photoUrl?: string;
  status: 'draft' | 'live' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const VendorServiceSchema = new Schema<IVendorServiceItem>(
  {
    name: { type: String, required: true },
    description: { type: String, maxlength: 300 },
    imageUrl: { type: String },
  },
  { _id: false },
);

const VendorSchema = new Schema<IVendor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: { type: String, required: true },
    category: { type: String, required: true },
    area: { type: String, required: true },
    about: { type: String, maxlength: 200 },
    services: [VendorServiceSchema],
    photoUrl: { type: String },
    status: { type: String, required: true, enum: ['draft', 'live', 'inactive'], index: true },
  },
  { timestamps: true },
);

VendorSchema.index({ category: 1, status: 1 });

export const VendorModel = model<IVendor>('Vendor', VendorSchema);
