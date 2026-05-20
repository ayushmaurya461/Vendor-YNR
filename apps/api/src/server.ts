import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { env } from './config/env.js';
import { useLocalPhotoUpload } from './modules/media/cloudinary.util.js';
import mongoPlugin from './plugins/mongodb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../uploads');
import corsPlugin from './plugins/cors.js';
import sensiblePlugin from './plugins/sensible.js';
import jwtPlugin from './plugins/jwt.js';
import healthRoutes from './modules/health/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import vendorRoutes from './modules/vendors/vendor.routes.js';
import userRoutes from './modules/users/user.routes.js';
import savedVendorRoutes from './modules/saved-vendors/saved-vendor.routes.js';
import mediaRoutes from './modules/media/media.routes.js';

async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(sensiblePlugin);
  await app.register(mongoPlugin);
  await app.register(corsPlugin);
  await app.register(jwtPlugin);

  if (useLocalPhotoUpload()) {
    await mkdir(UPLOADS_DIR, { recursive: true });
    await app.register(fastifyStatic, {
      root: UPLOADS_DIR,
      prefix: '/uploads/',
      decorateReply: false,
    });
  }

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(vendorRoutes, { prefix: '/vendors' });
  await app.register(userRoutes, { prefix: '/users' });
  await app.register(savedVendorRoutes, { prefix: '/users' });
  await app.register(mediaRoutes, { prefix: '/media' });

  return app;
}

const app = await buildServer();

await app.listen({ port: env.PORT, host: '0.0.0.0' });
