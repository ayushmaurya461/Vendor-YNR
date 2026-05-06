export const sendOtpBodySchema = {
  type: 'object',
  required: ['phone'],
  additionalProperties: false,
  properties: {
    phone: { type: 'string', minLength: 10, maxLength: 14 },
  },
} as const;

export const verifyOtpBodySchema = {
  type: 'object',
  required: ['phone', 'otp'],
  additionalProperties: false,
  properties: {
    phone: { type: 'string', minLength: 10, maxLength: 14 },
    otp: { type: 'string', minLength: 4, maxLength: 4 },
    role: { type: 'string', enum: ['customer', 'vendor'] },
  },
} as const;
