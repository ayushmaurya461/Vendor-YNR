import { Schema, Types, model } from 'mongoose';

export interface ISavedVendor {
  userId: Types.ObjectId;
  vendorId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SavedVendorSchema = new Schema<ISavedVendor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  },
  { timestamps: true },
);

SavedVendorSchema.index({ userId: 1, vendorId: 1 }, { unique: true });
SavedVendorSchema.index({ userId: 1, createdAt: -1 });

export const SavedVendorModel = model<ISavedVendor>('SavedVendor', SavedVendorSchema);
