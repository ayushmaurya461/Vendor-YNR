import { Schema, Types, model } from 'mongoose';

export type VendorEventType = 'view' | 'call' | 'whatsapp';

export interface IVendorEvent {
  vendorId: Types.ObjectId;
  type: VendorEventType;
  createdAt: Date;
}

const VendorEventSchema = new Schema<IVendorEvent>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    type: { type: String, required: true, enum: ['view', 'call', 'whatsapp'] },
    createdAt: { type: Date, required: true, default: () => new Date(), index: true },
  },
  { timestamps: false },
);

VendorEventSchema.index({ vendorId: 1, createdAt: -1 });

export const VendorEventModel = model<IVendorEvent>('VendorEvent', VendorEventSchema);
