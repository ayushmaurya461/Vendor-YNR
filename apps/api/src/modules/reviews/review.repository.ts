import { Types } from 'mongoose';
import { ReviewModel, type IReview } from './review.schema.js';

export async function findReviewsByVendorId(
  vendorId: string,
  limit = 20,
): Promise<(IReview & { _id: Types.ObjectId })[]> {
  if (!Types.ObjectId.isValid(vendorId)) {
    return [];
  }
  return ReviewModel.find({ vendorId: new Types.ObjectId(vendorId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<(IReview & { _id: Types.ObjectId })[]>()
    .exec();
}

export async function createReview(params: {
  vendorId: string;
  authorName: string;
  rating: number;
  comment: string;
}): Promise<(IReview & { _id: Types.ObjectId }) | null> {
  if (!Types.ObjectId.isValid(params.vendorId)) {
    return null;
  }
  const created = await ReviewModel.create({
    vendorId: new Types.ObjectId(params.vendorId),
    authorName: params.authorName,
    rating: params.rating,
    comment: params.comment,
  });
  return created.toObject() as IReview & { _id: Types.ObjectId };
}
