import { Schema, Types, model } from 'mongoose';

export interface IReview {
  vendorId: Types.ObjectId;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    authorName: { type: String, required: true, maxlength: 80 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true },
);

ReviewSchema.index({ vendorId: 1, createdAt: -1 });

export const ReviewModel = model<IReview>('Review', ReviewSchema);
