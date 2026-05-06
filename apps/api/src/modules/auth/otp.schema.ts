import { Schema, model } from 'mongoose';

export interface IOtp {
  phone: string;
  code: string;
  verifyAttempts: number;
  expiresAt: Date;
  sendCountWindow: number;
  windowStartedAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    phone: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true },
    verifyAttempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    sendCountWindow: { type: Number, default: 0 },
    windowStartedAt: { type: Date, required: true },
  },
  { timestamps: false },
);

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpModel = model<IOtp>('Otp', OtpSchema);
