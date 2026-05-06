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
  patch: Partial<Pick<IUser, 'name' | 'area'>>,
): Promise<(IUser & { _id: Types.ObjectId }) | null> {
  return UserModel.findByIdAndUpdate(userId, { $set: patch }, { new: true })
    .lean<(IUser & { _id: Types.ObjectId }) | null>()
    .exec();
}
