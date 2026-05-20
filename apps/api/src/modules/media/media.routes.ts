import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import type { FastifyPluginAsync } from 'fastify';
import multipart from '@fastify/multipart';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';
import { isCloudinaryConfigured, useLocalPhotoUpload } from './cloudinary.util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.join(__dirname, '../../../uploads');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;

const mediaRoutes: FastifyPluginAsync = async (app) => {
  await app.register(multipart, {
    limits: { fileSize: MAX_BYTES, files: 1 },
  });

  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
  } else if (!useLocalPhotoUpload()) {
    app.log.warn(
      'Cloudinary is not configured and local photo upload is disabled in production. Photo uploads will fail until CLOUDINARY_* env vars are set.',
    );
  } else {
    app.log.info('Cloudinary not configured — using local uploads folder (development only).');
  }

  app.get<{ Querystring: { scope?: string } }>(
    '/sign',
    {
      preHandler: [app.authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            scope: { type: 'string', enum: ['profile', 'vendor'] },
          },
        },
      },
    },
    async (request, reply) => {
      const scope = request.query.scope === 'profile' ? 'profile' : 'vendor';
      if (scope === 'vendor' && request.user.role !== 'vendor') {
        throw app.httpErrors.forbidden();
      }
      if (scope === 'profile' && request.user.role !== 'customer') {
        throw app.httpErrors.forbidden();
      }

      if (useLocalPhotoUpload()) {
        return reply.send({
          success: true,
          data: { provider: 'local' as const },
        });
      }

      if (!isCloudinaryConfigured()) {
        throw app.httpErrors.serviceUnavailable(
          'Photo upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in apps/api/.env — see https://console.cloudinary.com',
        );
      }

      const timestamp = Math.round(Date.now() / 1000);
      const folder = scope === 'profile' ? 'ynr-local/users' : 'ynr-local/vendors';
      const paramsToSign = { folder, timestamp };
      const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        env.CLOUDINARY_API_SECRET,
      );

      return reply.send({
        success: true,
        data: {
          provider: 'cloudinary' as const,
          signature,
          timestamp,
          cloudName: env.CLOUDINARY_CLOUD_NAME,
          apiKey: env.CLOUDINARY_API_KEY,
          folder,
        },
      });
    },
  );

  app.post<{ Querystring: { scope?: string } }>(
    '/upload',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (!useLocalPhotoUpload()) {
        throw app.httpErrors.notFound();
      }

      const scope = request.query.scope === 'profile' ? 'profile' : 'vendor';
      if (scope === 'vendor' && request.user.role !== 'vendor') {
        throw app.httpErrors.forbidden();
      }
      if (scope === 'profile' && request.user.role !== 'customer') {
        throw app.httpErrors.forbidden();
      }

      const file = await request.file();
      if (!file) {
        throw app.httpErrors.badRequest('No file uploaded');
      }
      if (!ALLOWED_MIME.has(file.mimetype)) {
        throw app.httpErrors.badRequest('Use a JPG, PNG, or WebP image.');
      }

      const ext =
        file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
      const dir = path.join(UPLOADS_ROOT, scope);
      await mkdir(dir, { recursive: true });
      const filename = `${request.user.userId}-${Date.now()}.${ext}`;
      const dest = path.join(dir, filename);
      await pipeline(file.file, createWriteStream(dest));

      const publicPath = `/uploads/${scope}/${filename}`;
      const host = request.headers.host ?? `localhost:${env.PORT}`;
      const protocol = request.protocol;
      const url = `${protocol}://${host}${publicPath}`;

      return reply.send({ success: true, data: { url } });
    },
  );
};

export default mediaRoutes;
