import { env } from '../../config/env.js';

const PLACEHOLDER_CLOUDINARY = new Set([
  'your_key',
  'your_cloud',
  'your_secret',
  'your_cloud_name',
  'your_api_key',
  'your_api_secret',
]);

export function isCloudinaryConfigured(): boolean {
  const values = [env.CLOUDINARY_CLOUD_NAME, env.CLOUDINARY_API_KEY, env.CLOUDINARY_API_SECRET];
  return !values.some((v) => PLACEHOLDER_CLOUDINARY.has(v) || v.startsWith('your_'));
}

/** Save uploads to apps/api/uploads instead of Cloudinary. */
export function useLocalPhotoUpload(): boolean {
  if (env.NODE_ENV === 'production') {
    return false;
  }
  if (env.MEDIA_UPLOAD === 'cloudinary') {
    return false;
  }
  // development + auto/local: always use disk (avoids broken/disabled Cloudinary accounts locally)
  return true;
}
