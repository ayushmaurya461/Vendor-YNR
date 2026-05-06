import type { FastifyInstance } from 'fastify';
import { OtpModel } from './otp.schema.js';
import * as UserRepo from '../users/user.repository.js';
import { sendOtpSms } from '../../lib/msg91.js';
import { toUserDto } from '../users/user.mapper.js';
import type { UserRoleDto } from '../../types/dto.js';

const WINDOW_MS = 10 * 60 * 1000;
const OTP_MS = 5 * 60 * 1000;
const MAX_SEND_WINDOW = 3;
const MAX_VERIFY_ATTEMPTS = 3;

function normalizePhoneDigits(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

function assertPhone(app: FastifyInstance, tenDigit: string): void {
  if (!/^[6-9]\d{9}$/.test(tenDigit)) {
    throw app.httpErrors.badRequest('Invalid phone number');
  }
}

export async function sendOtp(app: FastifyInstance, rawPhone: string): Promise<void> {
  const phone = normalizePhoneDigits(rawPhone);
  assertPhone(app, phone);

  const now = new Date();
  let doc = await OtpModel.findOne({ phone });

  if (!doc) {
    doc = new OtpModel({
      phone,
      code: '0000',
      verifyAttempts: 0,
      expiresAt: new Date(now.getTime() + OTP_MS),
      sendCountWindow: 0,
      windowStartedAt: now,
    });
  }

  if (now.getTime() - doc.windowStartedAt.getTime() > WINDOW_MS) {
    doc.sendCountWindow = 0;
    doc.windowStartedAt = now;
  }

  if (doc.sendCountWindow >= MAX_SEND_WINDOW) {
    throw app.httpErrors.tooManyRequests('Too many OTP requests. Try again later.');
  }

  const code = String(Math.floor(1000 + Math.random() * 9000));
  doc.code = code;
  doc.verifyAttempts = 0;
  doc.expiresAt = new Date(now.getTime() + OTP_MS);
  doc.sendCountWindow += 1;
  await doc.save();

  await sendOtpSms(`91${phone}`, code);
}

export async function verifyOtp(
  app: FastifyInstance,
  opts: {
    rawPhone: string;
    otp: string;
    requestedRole?: UserRoleDto | undefined;
  },
): Promise<{ token: string; user: ReturnType<typeof toUserDto> }> {
  const phone = normalizePhoneDigits(opts.rawPhone);
  assertPhone(app, phone);

  const doc = await OtpModel.findOne({ phone });
  if (!doc) {
    throw app.httpErrors.unauthorized('OTP expired or invalid');
  }

  if (doc.expiresAt.getTime() < Date.now()) {
    await OtpModel.deleteOne({ phone });
    throw app.httpErrors.unauthorized('OTP expired');
  }

  if (doc.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
    await OtpModel.deleteOne({ phone });
    throw app.httpErrors.unauthorized('Too many incorrect attempts');
  }

  if (doc.code !== opts.otp.trim()) {
    doc.verifyAttempts += 1;
    await doc.save();
    throw app.httpErrors.unauthorized('Invalid OTP');
  }

  await OtpModel.deleteOne({ phone });

  const existing = await UserRepo.findUserByPhone(phone);

  let userIdStr: string;
  let role: UserRoleDto;

  if (!existing) {
    role = opts.requestedRole ?? 'customer';
    const created = await UserRepo.createUser({ phone, role });
    userIdStr = created._id.toString();
    const refreshed = await UserRepo.findUserById(userIdStr);
    const token = app.jwt.sign({ userId: userIdStr, role, phone }, { expiresIn: '30d' });
    if (!refreshed) throw app.httpErrors.internalServerError();
    return { token, user: toUserDto(refreshed) };
  }

  role = existing.role;

  userIdStr = existing._id.toString();
  const token = app.jwt.sign({ userId: userIdStr, role: existing.role, phone }, { expiresIn: '30d' });
  return { token, user: toUserDto(existing) };
}
