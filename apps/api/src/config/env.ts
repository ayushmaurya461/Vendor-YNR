import 'dotenv/config';
import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    MONGODB_URI: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    FRONTEND_ORIGIN: z.string().min(1),
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    /** auto = local disk in development, Cloudinary in production when configured */
    MEDIA_UPLOAD: z.enum(['auto', 'local', 'cloudinary']).default('auto'),
    OTP_LOG_ONLY: z.coerce.boolean().default(false),
    MSG91_AUTH_KEY: z.string().optional(),
    MSG91_TEMPLATE_ID: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.OTP_LOG_ONLY && (!data.MSG91_AUTH_KEY?.length || !data.MSG91_TEMPLATE_ID?.length)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MSG91_AUTH_KEY and MSG91_TEMPLATE_ID are required unless OTP_LOG_ONLY=true',
      });
    }
  });

export type Env = z.infer<typeof schema>;

function loadEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}

export const env = loadEnv();
