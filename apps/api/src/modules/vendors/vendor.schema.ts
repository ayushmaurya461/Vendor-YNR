import { Schema, Types, model } from 'mongoose';
export interface IVendor {
  userId: Types.ObjectId;
  name: string;
  phone: string;
  whatsapp: string;
  category: string;
  area: string;
  about?: string;
  services?: string[];
  photoUrl?: string;
  status: 'draft' | 'live' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: { type: String, required: true },
    category: { type: String, required: true },
    area: { type: String, required: true },
    about: { type: String, maxlength: 200 },
    services: [{ type: String }],
    photoUrl: { type: String },
    status: { type: String, required: true, enum: ['draft', 'live', 'inactive'], index: true },
  },
  { timestamps: true },
);

VendorSchema.index({ category: 1, status: 1 });

export const VendorModel = model<IVendor>('Vendor', VendorSchema);
