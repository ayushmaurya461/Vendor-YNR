import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import type { FastifyPluginAsync } from 'fastify';
import { env } from '../config/env.js';

const CAPACITOR_ORIGINS = ['https://localhost', 'capacitor://localhost', 'http://localhost'];

function allowedOrigins(): string[] {
  const configured = env.FRONTEND_ORIGIN.split(',').map((o) => o.trim());
  const extra = env.NODE_ENV === 'development' ? CAPACITOR_ORIGINS : [];
  return [...new Set([...configured, ...extra])];
}

const corsPlugin: FastifyPluginAsync = async (app) => {
  await app.register(cors, {
    origin: allowedOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
};

export default fp(corsPlugin);
