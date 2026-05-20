import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { Types, type FilterQuery } from 'mongoose';
import * as VendorRepo from './vendor.repository.js';
import { toVendorDto } from './vendor.mapper.js';
import type { IVendor } from './vendor.schema.js';
import * as Analytics from '../analytics/analytics.service.js';
import type { JwtPayload } from '../../plugins/jwt.js';
import * as ReviewRepo from '../reviews/review.repository.js';
import { toReviewDto } from '../reviews/review.mapper.js';
import * as UserRepo from '../users/user.repository.js';
import { normalizeServicesInput } from './vendor-service.util.js';

const vendorServiceItemSchema = {
  type: 'object',
  required: ['name'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 80 },
    description: { type: 'string', maxLength: 300 },
    imageUrl: { type: 'string' },
  },
} as const;

const vendorServicesSchema = {
  type: 'array',
  items: {
    oneOf: [{ type: 'string', minLength: 1 }, vendorServiceItemSchema],
  },
} as const;

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readBearerToken(request: FastifyRequest): string | undefined {
  const header = request.headers.authorization;
  if (header === undefined || !header.startsWith('Bearer ')) {
    return undefined;
  }
  const token = header.slice(7).trim();
  return token.length > 0 ? token : undefined;
}

/** When a vendor browses nearby listings, omit their own profile from results. */
async function excludeOwnVendorFromFilter(
  request: FastifyRequest,
  filter: FilterQuery<IVendor>,
): Promise<void> {
  const token = readBearerToken(request);
  if (token === undefined) {
    return;
  }

  try {
    const payload = request.server.jwt.verify<JwtPayload>(token);
    const ownVendor = await VendorRepo.findVendorByUserId(payload.userId);
    if (ownVendor) {
      filter.userId = { $ne: new Types.ObjectId(payload.userId) };
    }
  } catch {
    /* invalid or expired token — treat as anonymous */
  }
}

async function assertOwnVendor(app: import('fastify').FastifyInstance, vendorUserId: string, vendorDoc: IVendor): Promise<void> {
  if (vendorDoc.userId.toString() !== vendorUserId) {
    throw app.httpErrors.forbidden();
  }
}

const HOME_TOP_LIMIT = 4;
const HOME_PER_CATEGORY = 3;
const HOME_FEATURED_CATEGORIES = ['electrician', 'plumber', 'gardener', 'mechanic', 'photographer'] as const;

function applyCategoryFilter(
  filter: FilterQuery<IVendor>,
  category?: string,
  categories?: string,
): void {
  const multi = categories
    ?.split(',')
    .map((c) => c.trim())
    .filter((c) => c.length > 0 && c !== 'all');
  if (multi && multi.length > 0) {
    filter.category = { $in: multi };
    return;
  }
  if (category !== undefined && category.length > 0 && category !== 'all') {
    filter.category = category;
  }
}

const vendorRoutes: FastifyPluginAsync = async (app) => {
  /** Home feed — top picks + samples per category */
  app.get('/home', async (request, reply) => {
    const filter: FilterQuery<IVendor> = {};
    await excludeOwnVendorFromFilter(request, filter);

    const topRows = await VendorRepo.findLiveVendors({
      filter,
      skip: 0,
      limit: HOME_TOP_LIMIT,
      sort: { createdAt: -1 },
    });

    const byCategory = (
      await Promise.all(
        HOME_FEATURED_CATEGORIES.map(async (category) => {
          const catFilter: FilterQuery<IVendor> = { ...filter, category };
          const items = await VendorRepo.findLiveVendors({
            filter: catFilter,
            skip: 0,
            limit: HOME_PER_CATEGORY,
            sort: { createdAt: -1 },
          });
          return { category, items: items.map(toVendorDto) };
        }),
      )
    ).filter((section) => section.items.length > 0);

    return reply.send({
      success: true,
      data: {
        topVendors: topRows.map(toVendorDto),
        byCategory,
      },
    });
  });

  /** Public listing — filters: category, categories (comma-separated), area, q, page, limit */
  app.get<{
    Querystring: {
      category?: string;
      categories?: string;
      area?: string;
      q?: string;
      page?: string | number;
      limit?: string | number;
    };
  }>('/', async (request, reply) => {
    const pageRaw = Number(request.query.page ?? 1);
    const limitRaw = Number(request.query.limit ?? 20);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(50, Math.floor(limitRaw)) : 20;

    const filter: FilterQuery<IVendor> = {};

    applyCategoryFilter(filter, request.query.category, request.query.categories);

    const area = request.query.area;
    if (area !== undefined && area.trim().length > 0) {
      filter.area = { $regex: new RegExp(escapeRegex(area.trim()), 'i') };
    }

    const q = request.query.q;
    if (q !== undefined && q.trim().length > 0) {
      const rx = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [{ name: rx }, { area: rx }];
    }

    await excludeOwnVendorFromFilter(request, filter);

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

  /** Authenticated: all listings for current vendor user (must be before `/:id`) */
  app.get('/me/listings', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'vendor') {
      throw app.httpErrors.forbidden();
    }
    const rows = await VendorRepo.findVendorsByUserId(request.user.userId);
    return reply.send({ success: true, data: { items: rows.map(toVendorDto) } });
  });

  /** Authenticated: most recent listing for current vendor user */
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
            services: vendorServicesSchema,
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
        services: normalizeServicesInput(body.services),
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
            services: vendorServicesSchema,
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
      if (request.body.services !== undefined) {
        patch.services = normalizeServicesInput(request.body.services);
      }
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

  /** Submit a review for another vendor's listing */
  app.post<{
    Params: { id: string };
    Body: { rating: number; comment: string };
  }>(
    '/:id/reviews',
    {
      preHandler: [app.authenticate],
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
        body: {
          type: 'object',
          required: ['rating', 'comment'],
          additionalProperties: false,
          properties: {
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string', minLength: 1, maxLength: 500 },
          },
        },
      },
    },
    async (request, reply) => {
      const vendorDoc = await VendorRepo.findVendorById(request.params.id);
      if (!vendorDoc || vendorDoc.status === 'draft') {
        throw app.httpErrors.notFound('Vendor not found');
      }
      if (vendorDoc.userId.toString() === request.user.userId) {
        throw app.httpErrors.forbidden('You cannot review your own listing');
      }

      const user = await UserRepo.findUserById(request.user.userId);
      if (!user) {
        throw app.httpErrors.unauthorized();
      }
      let authorName = user.name?.trim();
      if (!authorName && request.user.role === 'vendor') {
        const ownListing = await VendorRepo.findVendorByUserId(request.user.userId);
        authorName = ownListing?.name?.trim();
      }
      if (!authorName) {
        throw app.httpErrors.badRequest('Add your name in profile before submitting a review');
      }

      const comment = request.body.comment.trim();
      if (!comment) {
        throw app.httpErrors.badRequest('Comment is required');
      }

      const created = await ReviewRepo.createReview({
        vendorId: request.params.id,
        authorName,
        rating: request.body.rating,
        comment,
      });
      if (!created) {
        throw app.httpErrors.badRequest('Invalid vendor');
      }

      return reply.status(201).send({ success: true, data: toReviewDto(created) });
    },
  );

  /** Public reviews for a vendor */
  app.get<{ Params: { id: string } }>(
    '/:id/reviews',
    {
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      },
    },
    async (request, reply) => {
      const vendorDoc = await VendorRepo.findVendorById(request.params.id);
      if (!vendorDoc || vendorDoc.status === 'draft') {
        throw app.httpErrors.notFound('Vendor not found');
      }
      const rows = await ReviewRepo.findReviewsByVendorId(request.params.id);
      return reply.send({
        success: true,
        data: { items: rows.map(toReviewDto) },
      });
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
