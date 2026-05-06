import type { FastifyPluginAsync } from 'fastify';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';

const mediaRoutes: FastifyPluginAsync = async (app) => {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });

  app.get(
    '/sign',
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      if (request.user.role !== 'vendor') {
        throw app.httpErrors.forbidden();
      }

      const timestamp = Math.round(Date.now() / 1000);
      const folder = 'ynr-local/vendors';
      const paramsToSign = { folder, timestamp };
      const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        env.CLOUDINARY_API_SECRET,
      );

      return reply.send({
        success: true,
        data: {
          signature,
          timestamp,
          cloudName: env.CLOUDINARY_CLOUD_NAME,
          apiKey: env.CLOUDINARY_API_KEY,
          folder,
        },
      });
    },
  );
};

export default mediaRoutes;
