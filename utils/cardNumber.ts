export type CardBrand = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'OTHER';

export const sanitizeCardNumber = (value: string) => value.replace(/\D/g, '');

export const detectBrand = (digits: string): CardBrand => {
  if (!digits.length) {
    return 'OTHER';
  }

  const firstDigit = digits[0];
  if (firstDigit === '3') {
    return 'AMEX';
  }
  if (firstDigit === '4') {
    return 'VISA';
  }
  if (firstDigit === '5') {
    return 'MASTERCARD';
  }
  if (firstDigit === '6') {
    return 'DISCOVER';
  }
  return 'OTHER';
};

export const limitDigitsForBrand = (digits: string, brand: CardBrand) =>
  brand === 'AMEX' ? digits.slice(0, 15) : digits.slice(0, 16);

export const formatCardNumber = (digits: string, brandOverride?: CardBrand) => {
  const sanitized = sanitizeCardNumber(digits);
  if (!sanitized) {
    return '';
  }

  const brand = brandOverride ?? detectBrand(sanitized);
  if (brand === 'AMEX') {
    const part1 = sanitized.slice(0, 4);
    const part2 = sanitized.slice(4, 10);
    const part3 = sanitized.slice(10, 15);
    return [part1, part2, part3].filter(Boolean).join(' ').trim();
  }

  return sanitized
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .replace(/\s+$/g, '')
    .trim();
};

export const passesLuhnCheck = (digits: string) => {
  if (!digits) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (Number.isNaN(digit)) {
      return false;
    }

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

export const looksLikeCardNumber = (digits: string) => {
  const sanitized = sanitizeCardNumber(digits);

  if (sanitized.length === 15) {
    return sanitized.startsWith('3') && passesLuhnCheck(sanitized);
  }

  if (sanitized.length === 16) {
    return /^[456]/.test(sanitized) && passesLuhnCheck(sanitized);
  }

  return false;
};
