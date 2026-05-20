import { Types } from 'mongoose';
import { SavedVendorModel } from './saved-vendor.schema.js';

export async function findSavedVendorIdsByUserId(userId: string): Promise<string[]> {
  if (!Types.ObjectId.isValid(userId)) {
    return [];
  }
  const rows = await SavedVendorModel.find({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .select('vendorId')
    .lean<{ vendorId: Types.ObjectId }[]>()
    .exec();
  return rows.map((row) => row.vendorId.toString());
}

export async function isVendorSavedByUser(userId: string, vendorId: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(vendorId)) {
    return false;
  }
  const row = await SavedVendorModel.findOne({
    userId: new Types.ObjectId(userId),
    vendorId: new Types.ObjectId(vendorId),
  })
    .select('_id')
    .lean()
    .exec();
  return row !== null;
}

export async function addSavedVendor(userId: string, vendorId: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(vendorId)) {
    return false;
  }
  try {
    await SavedVendorModel.create({
      userId: new Types.ObjectId(userId),
      vendorId: new Types.ObjectId(vendorId),
    });
    return true;
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 11000) {
      return true;
    }
    return false;
  }
}

export async function removeSavedVendor(userId: string, vendorId: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(vendorId)) {
    return false;
  }
  const result = await SavedVendorModel.deleteOne({
    userId: new Types.ObjectId(userId),
    vendorId: new Types.ObjectId(vendorId),
  }).exec();
  return result.deletedCount > 0;
}
