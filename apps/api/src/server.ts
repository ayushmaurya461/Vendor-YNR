import Fastify from 'fastify';
import { env } from './config/env.js';
import mongoPlugin from './plugins/mongodb.js';
import corsPlugin from './plugins/cors.js';
import sensiblePlugin from './plugins/sensible.js';
import jwtPlugin from './plugins/jwt.js';
import healthRoutes from './modules/health/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import vendorRoutes from './modules/vendors/vendor.routes.js';
import userRoutes from './modules/users/user.routes.js';
import mediaRoutes from './modules/media/media.routes.js';

async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(sensiblePlugin);
  await app.register(mongoPlugin);
  await app.register(corsPlugin);
  await app.register(jwtPlugin);

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(vendorRoutes, { prefix: '/vendors' });
  await app.register(userRoutes, { prefix: '/users' });
  await app.register(mediaRoutes, { prefix: '/media' });

  return app;
}

const app = await buildServer();

await app.listen({ port: env.PORT, host: '0.0.0.0' });
