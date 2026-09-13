import type { CardFormData, StoredCard } from './cardData';
import {
  detectBrand,
  looksLikeCardNumber,
  normalizeExpiry,
  sanitizeCardNumber,
} from './cardNumber';

export function defaultCardName(cards: Pick<StoredCard, 'description'>[]) {
  const names = new Set(cards.map((card) => card.description.trim().toLowerCase()));
  let number = 1;
  while (names.has(`card ${number}`)) number += 1;
  return `Card ${number}`;
}

export function validateCardForm(form: CardFormData, originalNumber?: string) {
  const errors: Partial<Record<keyof CardFormData, string>> = {};
  const number = sanitizeCardNumber(form.number);
  if (!form.description.trim()) errors.description = 'Give this card a name.';
  if (
    number.length < 13 ||
    number.length > 19 ||
    (detectBrand(number) === 'AMEX' && number.length !== 15)
  )
    errors.number = 'Enter a complete card number (13–19 digits; 15 for Amex).';
  else if (number !== originalNumber && !looksLikeCardNumber(number))
    errors.number =
      'This number doesn’t pass the card check. Check the digits.';
  if (!normalizeExpiry(form.expiry)) errors.expiry = 'Use MM/YY or MM/YYYY.';
  if (form.cvv && !/^\d{3,4}$/.test(form.cvv))
    errors.cvv = 'Use 3 or 4 digits, or leave blank.';
  return errors;
}
