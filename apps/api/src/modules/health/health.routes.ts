import type { FastifyPluginAsync } from 'fastify';
import mongoose from 'mongoose';

const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => ({
    ok: true,
    service: 'ynr-api',
    db: mongoose.connection.readyState === 1,
  }));
};

export default healthRoutes;
