import type { Types } from 'mongoose';
import { VendorEventModel, type VendorEventType } from './event.schema.js';

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const res = new Date(d);
  res.setHours(0, 0, 0, 0);
  res.setDate(res.getDate() - diff);
  return res;
}

export async function recordVendorEvent(
  vendorId: Types.ObjectId | string,
  type: VendorEventType,
): Promise<void> {
  await VendorEventModel.create({
    vendorId,
    type,
    createdAt: new Date(),
  });
}

export async function aggregateVendorStats(
  vendorId: Types.ObjectId | string,
): Promise<{ profileViews: number; callsThisWeek: number; whatsappsThisWeek: number }> {
  const weekStart = startOfWeek(new Date());

  const [callsThisWeek, whatsappsThisWeek, profileViewsRolling] = await Promise.all([
    VendorEventModel.countDocuments({ vendorId, type: 'call', createdAt: { $gte: weekStart } }),
    VendorEventModel.countDocuments({ vendorId, type: 'whatsapp', createdAt: { $gte: weekStart } }),
    VendorEventModel.countDocuments({
      vendorId,
      type: 'view',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  return {
    profileViews: profileViewsRolling,
    callsThisWeek,
    whatsappsThisWeek,
  };
}
