import { looksLikeCardNumber, normalizeExpiry } from './cardNumber';
import { detectCardProduct } from './cardProducts';
export function extractCardData(text: string): {
  number?: string;
  expiry?: string;
  productId?: string;
} {
  // Examine individual lines first, then a flattened segment for cards split over lines.
  const segments = [...text.split('\n'), text.replace(/\n/g, ' ')];
  let number: string | undefined;
  let expiry: string | undefined;
  for (const segment of segments) {
    if (!expiry) {
      const match = segment.match(/\b(0[1-9]|1[0-2])\s*\/\s*(\d{4}|\d{2})\b/);
      if (match)
        expiry = normalizeExpiry(`${match[1]}/${match[2]}`) ?? undefined;
    }
    if (!number) {
      for (const match of segment.matchAll(/\b\d(?:[ -]*\d){12,18}\b/g)) {
        const digits = match[0].replace(/\D/g, '');
        if (looksLikeCardNumber(digits)) {
          number = digits;
          break;
        }
      }
    }
  }
  const product = detectCardProduct(text, number);
  return { number, expiry, ...(product ? { productId: product.id } : {}) };
}
