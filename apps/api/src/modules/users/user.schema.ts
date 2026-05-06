import { Schema, model, type Types } from 'mongoose';

export interface IUser {
  phone: string;
  role: 'customer' | 'vendor';
  name?: string;
  area?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = IUser & { _id: Types.ObjectId };

const UserSchema = new Schema<IUser>(
  {
    phone: { type: String, required: true, unique: true, index: true },
    role: { type: String, required: true, enum: ['customer', 'vendor'] },
    name: { type: String },
    area: { type: String },
  },
  { timestamps: true },
);

export const UserModel = model<IUser>('User', UserSchema);
