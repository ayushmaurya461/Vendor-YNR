import { normalizePhone } from './phone.util';

export function getWhatsappUrl(phone: string, message?: string): string {
  const normalized = normalizePhone(phone);
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/91${normalized}${text}`;
}
