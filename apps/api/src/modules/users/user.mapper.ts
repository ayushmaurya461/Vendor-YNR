import type { Types } from 'mongoose';
import type { UserDto } from '../../types/dto.js';
import type { IUser } from './user.schema.js';

export function toUserDto(u: IUser & { _id: Types.ObjectId }): UserDto {
  return {
    id: u._id.toString(),
    phone: u.phone,
    role: u.role,
    name: u.name,
    area: u.area,
    photoUrl: u.photoUrl,
    createdAt: u.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}
