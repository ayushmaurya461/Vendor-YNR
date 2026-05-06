import type { FastifyPluginAsync } from 'fastify';
import { Types, type FilterQuery } from 'mongoose';
import * as VendorRepo from './vendor.repository.js';
import { toVendorDto } from './vendor.mapper.js';
import type { IVendor } from './vendor.schema.js';
import * as Analytics from '../analytics/analytics.service.js';

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function assertOwnVendor(app: import('fastify').FastifyInstance, vendorUserId: string, vendorDoc: IVendor): Promise<void> {
  if (vendorDoc.userId.toString() !== vendorUserId) {
    throw app.httpErrors.forbidden();
  }
}

const vendorRoutes: FastifyPluginAsync = async (app) => {
  /** Public listing */
  app.get<{
    Querystring: { category?: string; area?: string; q?: string; page?: string | number; limit?: string | number };
  }>('/', async (request, reply) => {
    const pageRaw = Number(request.query.page ?? 1);
    const limitRaw = Number(request.query.limit ?? 20);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(50, Math.floor(limitRaw)) : 20;

    const filter: FilterQuery<IVendor> = {};

    const cat = request.query.category;
    if (cat !== undefined && cat.length > 0) {
      filter.category = cat;
    }

    const area = request.query.area;
    if (area !== undefined && area.trim().length > 0) {
      filter.area = { $regex: new RegExp(escapeRegex(area.trim()), 'i') };
    }

    const q = request.query.q;
    if (q !== undefined && q.trim().length > 0) {
      const rx = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [{ name: rx }, { area: rx }];
    }

    const [total, rows] = await Promise.all([
      VendorRepo.countLiveVendors(filter),
      VendorRepo.findLiveVendors({ filter, skip: (page - 1) * limit, limit, sort: { createdAt: -1 } }),
    ]);

    return reply.send({
      success: true,
      data: {
        items: rows.map(toVendorDto),
        page,
        limit,
        total,
      },
    });
  });

  /** Authenticated: current vendor (must be before `/:id`) */
  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'vendor') {
      throw app.httpErrors.forbidden();
    }
    const vendorDoc = await VendorRepo.findVendorByUserId(request.user.userId);
    if (!vendorDoc) {
      throw app.httpErrors.notFound('Vendor profile not found');
    }
    return reply.send({ success: true, data: toVendorDto(vendorDoc) });
  });

  /** Create vendor listing */
  app.post<{
    Body: Partial<IVendor> & {
      category: string;
      name: string;
      area: string;
      phone: string;
    };
  }>(
    '/',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['category', 'name', 'area', 'phone'],
          additionalProperties: false,
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 120 },
            phone: { type: 'string', minLength: 10, maxLength: 15 },
            whatsapp: { type: 'string', minLength: 10, maxLength: 15 },
            category: { type: 'string', minLength: 1 },
            area: { type: 'string', minLength: 1, maxLength: 120 },
            about: { type: 'string', maxLength: 200 },
            services: { type: 'array', items: { type: 'string' } },
            photoUrl: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'live', 'inactive'] },
          },
        },
      },
    },
    async (request, reply) => {
      if (request.user.role !== 'vendor') {
        throw app.httpErrors.forbidden();
      }

      const existing = await VendorRepo.findVendorByUserId(request.user.userId);
      if (existing) {
        throw app.httpErrors.conflict('Vendor listing already exists');
      }

      const body = request.body;
      const whatsapp = body.whatsapp?.trim() || body.phone;

      const vendorIdResult = await VendorRepo.createVendor({
        userId: new Types.ObjectId(request.user.userId),
        name: body.name.trim(),
        phone: body.phone.trim(),
        whatsapp: whatsapp.trim(),
        category: body.category,
        area: body.area.trim(),
        about: body.about?.trim(),
        services: body.services,
        photoUrl: body.photoUrl,
        status:
          body.status === 'live' || body.status === 'inactive' || body.status === 'draft'
            ? body.status
            : 'draft',
      });

      const created = await VendorRepo.findVendorById(vendorIdResult._id.toString());
      if (!created) {
        throw app.httpErrors.internalServerError();
      }
      return reply.code(201).send({ success: true, data: toVendorDto(created) });
    },
  );

  /** Analytics fire-and-forget endpoint */
  app.post<{ Params: { id: string }; Body: { type: 'view' | 'call' | 'whatsapp' } }>(
    '/:id/events',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['type'],
          additionalProperties: false,
          properties: {
            type: { type: 'string', enum: ['view', 'call', 'whatsapp'] },
          },
        },
      },
    },
    async (request, reply) => {
      const vendorId = request.params.id;
      void Analytics.recordVendorEvent(vendorId, request.body.type).catch((err) =>
        request.log.error({ err }, 'event insert failed'),
      );
      return reply.code(204).send();
    },
  );

  /** Vendor dashboard stats */
  app.get<{ Params: { id: string } }>(
    '/:id/stats',
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      if (request.user.role !== 'vendor') {
        throw app.httpErrors.forbidden();
      }
      const vendorDoc = await VendorRepo.findVendorById(request.params.id);
      if (!vendorDoc) {
        throw app.httpErrors.notFound('Vendor not found');
      }
      await assertOwnVendor(app, request.user.userId, vendorDoc);
      const stats = await Analytics.aggregateVendorStats(vendorDoc._id);
      return reply.send({ success: true, data: stats });
    },
  );

  /** Update listing */
  app.patch<{ Params: { id: string }; Body: Partial<IVendor> }>(
    '/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
        body: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 120 },
            phone: { type: 'string', minLength: 10, maxLength: 15 },
            whatsapp: { type: 'string', minLength: 10, maxLength: 15 },
            category: { type: 'string', minLength: 1 },
            area: { type: 'string', minLength: 1, maxLength: 120 },
            about: { type: 'string', maxLength: 200 },
            services: { type: 'array', items: { type: 'string' } },
            photoUrl: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'live', 'inactive'] },
          },
        },
      },
    },
    async (request, reply) => {
      if (request.user.role !== 'vendor') {
        throw app.httpErrors.forbidden();
      }
      const vendorDoc = await VendorRepo.findVendorById(request.params.id);
      if (!vendorDoc) throw app.httpErrors.notFound('Vendor not found');
      await assertOwnVendor(app, request.user.userId, vendorDoc);

      const patch: Partial<IVendor> = { ...request.body };
      delete (patch as Partial<IVendor> & { userId?: unknown }).userId;
      delete patch.status;
      const updated = await VendorRepo.updateVendorById(request.params.id, patch);
      if (!updated) throw app.httpErrors.internalServerError();
      return reply.send({ success: true, data: toVendorDto(updated) });
    },
  );

  /** Status transitions */
  app.patch<{ Params: { id: string }; Body: { status: 'draft' | 'live' | 'inactive' } }>(
    '/:id/status',
    {
      preHandler: [app.authenticate],
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
        body: {
          type: 'object',
          required: ['status'],
          additionalProperties: false,
          properties: {
            status: { type: 'string', enum: ['draft', 'live', 'inactive'] },
          },
        },
      },
    },
    async (request, reply) => {
      if (request.user.role !== 'vendor') {
        throw app.httpErrors.forbidden();
      }
      const vendorDoc = await VendorRepo.findVendorById(request.params.id);
      if (!vendorDoc) throw app.httpErrors.notFound('Vendor not found');
      await assertOwnVendor(app, request.user.userId, vendorDoc);

      const next = request.body.status;
      if (next === 'live') {
        const w = vendorDoc.whatsapp?.trim() || vendorDoc.phone.trim();
        if (!vendorDoc.name.trim() || !vendorDoc.phone.trim() || !vendorDoc.area.trim() || !w) {
          throw app.httpErrors.badRequest('Complete required fields before going live');
        }
      }

      const updated = await VendorRepo.updateVendorById(request.params.id, { status: next });
      if (!updated) throw app.httpErrors.internalServerError();
      return reply.send({ success: true, data: toVendorDto(updated) });
    },
  );

  /** Public vendor detail */
  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      },
    },
    async (request, reply) => {
      const vendorDoc = await VendorRepo.findVendorById(request.params.id);
      if (!vendorDoc) {
        throw app.httpErrors.notFound('Vendor not found');
      }
      if (vendorDoc.status === 'draft') {
        throw app.httpErrors.notFound('Vendor not found');
      }
      return reply.send({ success: true, data: toVendorDto(vendorDoc) });
    },
  );
};

export default vendorRoutes;
