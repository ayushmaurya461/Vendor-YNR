import type { FastifyPluginAsync } from 'fastify';
import * as SavedRepo from './saved-vendor.repository.js';
import * as VendorRepo from '../vendors/vendor.repository.js';
import { toVendorDto } from '../vendors/vendor.mapper.js';

const savedVendorRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/me/saved-vendors',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const ids = await SavedRepo.findSavedVendorIdsByUserId(request.user.userId);
      const vendors = await VendorRepo.findVendorsByIds(ids);
      const byId = new Map(vendors.map((v) => [v._id.toString(), v]));
      const ordered = ids
        .map((id) => byId.get(id))
        .filter((v): v is NonNullable<typeof v> => v !== undefined);
      return reply.send({
        success: true,
        data: {
          ids,
          items: ordered.map(toVendorDto),
        },
      });
    },
  );

  app.post<{ Params: { vendorId: string } }>(
    '/me/saved-vendors/:vendorId',
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['vendorId'],
          properties: { vendorId: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const vendorDoc = await VendorRepo.findVendorById(request.params.vendorId);
      if (!vendorDoc || vendorDoc.status === 'draft') {
        throw app.httpErrors.notFound('Vendor not found');
      }
      if (vendorDoc.userId.toString() === request.user.userId) {
        throw app.httpErrors.forbidden('You cannot save your own listing');
      }

      const ok = await SavedRepo.addSavedVendor(request.user.userId, request.params.vendorId);
      if (!ok) {
        throw app.httpErrors.badRequest('Could not save vendor');
      }
      return reply.status(201).send({ success: true, data: { saved: true } });
    },
  );

  app.delete<{ Params: { vendorId: string } }>(
    '/me/saved-vendors/:vendorId',
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['vendorId'],
          properties: { vendorId: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      await SavedRepo.removeSavedVendor(request.user.userId, request.params.vendorId);
      return reply.send({ success: true, data: { saved: false } });
    },
  );
};

export default savedVendorRoutes;
