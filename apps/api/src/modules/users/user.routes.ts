import type { FastifyPluginAsync } from 'fastify';
import * as UserRepo from './user.repository.js';
import { toUserDto } from './user.mapper.js';

const userRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/me',
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const user = await UserRepo.findUserById(request.user.userId);
      if (!user) {
        throw app.httpErrors.notFound('User not found');
      }
      return reply.send({ success: true, data: toUserDto(user) });
    },
  );

  app.patch<{ Body: { name?: string; area?: string } }>(
    '/me',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 80 },
            area: { type: 'string', minLength: 1, maxLength: 120 },
          },
        },
      },
    },
    async (request, reply) => {
      const u = request.user;
      if (u.role !== 'customer') {
        throw app.httpErrors.forbidden();
      }

      const updated = await UserRepo.updateUser(u.userId, {
        name: request.body.name,
        area: request.body.area,
      });
      if (!updated) {
        throw app.httpErrors.notFound('User not found');
      }
      return reply.send({ success: true, data: toUserDto(updated) });
    },
  );
};

export default userRoutes;
