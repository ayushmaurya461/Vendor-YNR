export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-10);
}

export function formatIndianPhone(phone: string): string {
  const digits = normalizePhone(phone);
  if (digits.length !== 10) {
    return phone;
  }

  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}
