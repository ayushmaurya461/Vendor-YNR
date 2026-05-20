import type { Types } from 'mongoose';
import type { ReviewDto } from '../../types/dto.js';
import type { IReview } from './review.schema.js';

export function toReviewDto(review: IReview & { _id: Types.ObjectId }): ReviewDto {
  return {
    id: review._id.toString(),
    vendorId: review.vendorId.toString(),
    authorName: review.authorName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}
