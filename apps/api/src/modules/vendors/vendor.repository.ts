import type { FilterQuery, Types } from 'mongoose';
import { VendorModel, type IVendor } from './vendor.schema.js';

export async function createVendor(doc: Omit<IVendor, 'createdAt' | 'updatedAt'>): Promise<{
  _id: Types.ObjectId;
}> {
  const v = await VendorModel.create(doc);
  return { _id: v._id as Types.ObjectId };
}

export async function updateVendorById(
  vendorId: string,
  patch: Partial<IVendor>,
): Promise<(IVendor & { _id: Types.ObjectId }) | null> {
  return VendorModel.findByIdAndUpdate(vendorId, { $set: patch }, { new: true })
    .lean<(IVendor & { _id: Types.ObjectId }) | null>()
    .exec();
}

export async function findVendorById(
  vendorId: string,
): Promise<(IVendor & { _id: Types.ObjectId }) | null> {
  return VendorModel.findById(vendorId).lean<(IVendor & { _id: Types.ObjectId }) | null>().exec();
}

export async function findVendorByUserId(
  userId: string,
): Promise<(IVendor & { _id: Types.ObjectId }) | null> {
  return VendorModel.findOne({ userId }).lean<(IVendor & { _id: Types.ObjectId }) | null>().exec();
}

export async function countLiveVendors(filter: FilterQuery<IVendor>): Promise<number> {
  return VendorModel.countDocuments({ ...filter, status: 'live' }).exec();
}

export async function findLiveVendors(opts: {
  filter: FilterQuery<IVendor>;
  skip: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
}): Promise<(IVendor & { _id: Types.ObjectId })[]> {
  return VendorModel.find({ ...opts.filter, status: 'live' })
    .sort(opts.sort ?? { createdAt: -1 })
    .skip(opts.skip)
    .limit(opts.limit)
    .lean<(IVendor & { _id: Types.ObjectId })[]>()
    .exec();
}
