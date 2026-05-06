import fp from 'fastify-plugin';
import mongoose from 'mongoose';
import type { FastifyPluginAsync } from 'fastify';
import { env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    mongoose: typeof mongoose;
  }
}

const mongoPlugin: FastifyPluginAsync = async (app) => {
  await mongoose.connect(env.MONGODB_URI);
  app.decorate('mongoose', mongoose);
  app.addHook('onClose', async () => {
    await mongoose.disconnect();
  });
};

export default fp(mongoPlugin);
