import type { Types } from 'mongoose';
import { UserModel, type IUser } from './user.schema.js';

export async function findUserByPhone(phone: string): Promise<(IUser & { _id: Types.ObjectId }) | null> {
  return UserModel.findOne({ phone }).lean<(IUser & { _id: Types.ObjectId }) | null>().exec();
}

export async function findUserById(
  userId: string,
): Promise<(IUser & { _id: Types.ObjectId }) | null> {
  return UserModel.findById(userId).lean<(IUser & { _id: Types.ObjectId }) | null>().exec();
}

export async function createUser(params: Omit<IUser, 'createdAt' | 'updatedAt'>): Promise<{
  _id: Types.ObjectId;
}> {
  const created = await UserModel.create(params);
  return { _id: created._id as Types.ObjectId };
}

export async function updateUser(
  userId: string,
  patch: Partial<Pick<IUser, 'name' | 'area' | 'photoUrl'>>,
): Promise<(IUser & { _id: Types.ObjectId }) | null> {
  const $set: Partial<IUser> = {};
  if (patch.name !== undefined) {
    $set.name = patch.name;
  }
  if (patch.area !== undefined) {
    $set.area = patch.area;
  }
  if (patch.photoUrl !== undefined) {
    $set.photoUrl = patch.photoUrl === '' ? undefined : patch.photoUrl;
  }
  if (Object.keys($set).length === 0) {
    return findUserById(userId);
  }
  return UserModel.findByIdAndUpdate(userId, { $set }, { new: true })
    .lean<(IUser & { _id: Types.ObjectId }) | null>()
    .exec();
}
