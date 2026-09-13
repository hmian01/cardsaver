export type CardBrand = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'OTHER';
export const sanitizeCardNumber = (value: string) => value.replace(/\D/g, '');
export const detectBrand = (value: string): CardBrand => {
  const digits = sanitizeCardNumber(value);
  if (/^4/.test(digits)) return 'VISA';
  if (/^3[47]/.test(digits)) return 'AMEX';
  const prefix = Number(digits.slice(0, 4));
  if (
    /^5[1-5]/.test(digits) ||
    (digits.length >= 4 && prefix >= 2221 && prefix <= 2720)
  )
    return 'MASTERCARD';
  if (
    /^(6011|65|64[4-9])/.test(digits) ||
    (digits.length >= 6 &&
      Number(digits.slice(0, 6)) >= 622126 &&
      Number(digits.slice(0, 6)) <= 622925)
  )
    return 'DISCOVER';
  return 'OTHER';
};
export const limitDigitsForBrand = (digits: string, brand: CardBrand) =>
  digits.slice(0, brand === 'AMEX' ? 15 : 19);
export const formatCardNumber = (value: string, brandOverride?: CardBrand) => {
  const digits = sanitizeCardNumber(value);
  if ((brandOverride ?? detectBrand(digits)) === 'AMEX')
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10)]
      .filter(Boolean)
      .join(' ');
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
};
export const passesLuhnCheck = (digits: string) => {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (double) digit = digit * 2 > 9 ? digit * 2 - 9 : digit * 2;
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
};
export const looksLikeCardNumber = (value: string) => {
  const digits = sanitizeCardNumber(value);
  return digits.length >= 13 && digits.length <= 19 && passesLuhnCheck(digits);
};
export const normalizeExpiry = (value: string): string | null => {
  const match = value.trim().match(/^(0[1-9]|1[0-2])\s*\/?\s*(\d{4}|\d{2})$/);
  return match ? `${match[1]}/${match[2].slice(-2)}` : null;
};
export const formatExpiryInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 6);
  return digits.length <= 2
    ? digits
    : `${digits.slice(0, 2)}/${digits.slice(2)}`;
};
export const expiryStatus = (
  expiry: string,
  now = new Date(),
): 'expired' | 'soon' | 'valid' => {
  const normalized = normalizeExpiry(expiry);
  if (!normalized) return 'valid';
  const [month, year] = normalized.split('/').map(Number);
  const remaining =
    (2000 + year - now.getFullYear()) * 12 + month - 1 - now.getMonth();
  return remaining < 0 ? 'expired' : remaining <= 2 ? 'soon' : 'valid';
};
export const brandLabel = (brand: string) =>
  ({
    VISA: 'Visa',
    MASTERCARD: 'Mastercard',
    AMEX: 'American Express',
    DISCOVER: 'Discover',
    OTHER: 'Card',
  })[brand] ?? 'Card';
