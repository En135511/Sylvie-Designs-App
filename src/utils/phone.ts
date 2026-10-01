/** Digits (and a leading +) only, as required by tel: and wa.me links. */
export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}

export function whatsappUrl(phone: string, message?: string): string | null {
  const digits = normalizePhone(phone).replace(/^\+/, '');
  if (digits.length < 6) return null;
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${query}`;
}

export function telUrl(phone: string): string | null {
  const normalized = normalizePhone(phone);
  return normalized.length >= 3 ? `tel:${normalized}` : null;
}
