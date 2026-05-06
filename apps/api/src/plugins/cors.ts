import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import type { FastifyPluginAsync } from 'fastify';
import { env } from '../config/env.js';

const corsPlugin: FastifyPluginAsync = async (app) => {
  await app.register(cors, {
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  });
};

export default fp(corsPlugin);
