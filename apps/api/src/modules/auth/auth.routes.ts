import type { FastifyPluginAsync } from 'fastify';
import * as AuthService from './auth.service.js';
import { sendOtpBodySchema, verifyOtpBodySchema } from './auth.schemas.js';

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: { phone: string } }>(
    '/send-otp',
    {
      schema: {
        body: sendOtpBodySchema,
      },
    },
    async (request, reply) => {
      await AuthService.sendOtp(app, request.body.phone);
      return reply.send({ success: true });
    },
  );

  app.post<{
    Body: { phone: string; otp: string; role?: 'customer' | 'vendor' };
  }>(
    '/verify-otp',
    {
      schema: {
        body: verifyOtpBodySchema,
      },
    },
    async (request, reply) => {
      const requestedRole =
        request.body.role === undefined
          ? undefined
          : (request.body.role as 'customer' | 'vendor');

      const result = await AuthService.verifyOtp(app, {
        rawPhone: request.body.phone,
        otp: request.body.otp,
        requestedRole,
      });

      return reply.send({
        success: true,
        data: {
          token: result.token,
          user: result.user,
        },
      });
    },
  );
};

export default authRoutes;
