import { detectBrand, normalizeExpiry, sanitizeCardNumber } from './cardNumber';
export const CARD_VARIANTS = [
  'midnight',
  'sunset',
  'jade',
  'pearl',
  'lilac',
] as const;
export type CardVariant = (typeof CARD_VARIANTS)[number];
export type StoredCard = {
  id: string;
  description: string;
  cardholder: string;
  number: string;
  expiry: string;
  brand: string;
  cvv?: string;
  variant: CardVariant;
  note?: string;
  frontImage?: string;
  backImage?: string;
  favorite?: boolean;
};
export type CardFormData = Omit<StoredCard, 'id'>;
export const MAX_BACKUP_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_LENGTH = 3 * 1024 * 1024;
export const createId = () =>
  `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
export const isPortableImage = (value: string) =>
  value.length <= MAX_IMAGE_LENGTH &&
  /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
export const isLocalImage = (value: string) =>
  /^card-images\/[a-zA-Z0-9-]+\.(jpg|png|webp)$/.test(value) ||
  isPortableImage(value);

// Pick supported fields explicitly. Backups cannot introduce remote image URLs or file paths.
export const parseCard = (value: unknown, portable = false): StoredCard => {
  if (!isObject(value)) throw new Error('A card in this file is invalid.');
  for (const key of [
    'id',
    'description',
    'cardholder',
    'number',
    'expiry',
    'brand',
    'variant',
  ]) {
    if (typeof value[key] !== 'string' || (value[key] as string).length > 200)
      throw new Error(`A card has an invalid ${key}.`);
  }
  if (!value.id || !CARD_VARIANTS.includes(value.variant as CardVariant))
    throw new Error('A card has an invalid ID or color.');
  const number = sanitizeCardNumber(value.number as string);
  const expiry = normalizeExpiry(value.expiry as string);
  if (!expiry) throw new Error('A card has an invalid expiry date.');
  if (
    !/^[\d\s-]+$/.test(value.number as string) ||
    number.length < 13 ||
    number.length > 19
  )
    throw new Error('A card has an invalid number.');
  if (
    value.cvv !== undefined &&
    (typeof value.cvv !== 'string' || !/^\d{0,4}$/.test(value.cvv))
  )
    throw new Error('A card has an invalid security code.');
  if (
    value.note !== undefined &&
    (typeof value.note !== 'string' || value.note.length > 2000)
  )
    throw new Error('Card notes must be under 2,000 characters.');
  if (value.favorite !== undefined && typeof value.favorite !== 'boolean')
    throw new Error('A card has an invalid favorite value.');
  for (const key of ['frontImage', 'backImage']) {
    if (
      value[key] !== undefined &&
      (typeof value[key] !== 'string' ||
        !(portable ? isPortableImage : isLocalImage)(value[key] as string))
    )
      throw new Error('A card photo is invalid or too large.');
  }
  return {
    id: value.id as string,
    description: value.description as string,
    cardholder: value.cardholder as string,
    number,
    expiry,
    brand: detectBrand(number),
    variant: value.variant as CardVariant,
    ...(value.cvv ? { cvv: value.cvv as string } : {}),
    ...(value.note ? { note: value.note as string } : {}),
    ...(value.frontImage ? { frontImage: value.frontImage as string } : {}),
    ...(value.backImage ? { backImage: value.backImage as string } : {}),
    favorite: value.favorite === true,
  };
};
export const parseStoredCards = (value: unknown) => {
  if (!Array.isArray(value))
    throw new Error('Saved card data could not be read.');
  const cards = value.map((card) => parseCard(card));
  if (new Set(cards.map((card) => card.id)).size !== cards.length)
    throw new Error('Saved card IDs are not unique.');
  return cards;
};
export const parseBackup = (text: string): StoredCard[] => {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES)
    throw new Error('Choose a backup smaller than 25 MB.');
  let value: unknown;
  try {
    value = JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    throw new Error('This is not a valid JSON backup.');
  }
  const legacy = Array.isArray(value);
  if (
    !legacy &&
    (!isObject(value) || value.format !== 'cardsaver' || value.version !== 1)
  )
    throw new Error('Choose a CardSaver backup (version 1).');
  const records = legacy ? value : (value as Record<string, unknown>).cards;
  if (!Array.isArray(records) || records.length > 1000)
    throw new Error('A backup can contain up to 1,000 cards.');
  return records.map((card) => parseCard(card, true));
};
export const buildBackup = (cards: StoredCard[], includeCvv = false) => {
  if (cards.length > 1000)
    throw new Error('Select up to 1,000 cards per backup.');
  const portable = cards.map((card) =>
    parseCard({ ...card, cvv: includeCvv ? card.cvv : undefined }, true),
  );
  const text = JSON.stringify(
    {
      format: 'cardsaver',
      version: 1,
      exportedAt: new Date().toISOString(),
      cards: portable,
    },
    null,
    2,
  );
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES)
    throw new Error(
      'This backup exceeds 25 MB. Select fewer cards or leave out photos.',
    );
  return text;
};
export const planImport = (existing: StoredCard[], incoming: StoredCard[]) => {
  const numbers = new Set(
    existing.map((card) => sanitizeCardNumber(card.number)),
  );
  const additions: StoredCard[] = [];
  for (const card of incoming) {
    const number = sanitizeCardNumber(card.number);
    if (numbers.has(number)) continue;
    numbers.add(number);
    additions.push({ ...card, id: createId(), number });
  }
  return { additions, skipped: incoming.length - additions.length };
};
export const reorderCards = (cards: StoredCard[], ids: string[]) => {
  if (ids.length !== cards.length || new Set(ids).size !== ids.length)
    throw new Error('The wallet changed. Please try reordering again.');
  const byId = new Map(cards.map((card) => [card.id, card]));
  return ids.map((id) => {
    const card = byId.get(id);
    if (!card)
      throw new Error('The wallet changed. Please try reordering again.');
    return card;
  });
};
export const matchesCard = (card: StoredCard, search: string) => {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  const fields = [
    card.description,
    card.cardholder,
    card.brand,
    card.note ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return (
    fields.includes(query) ||
    (/^[\d\s-]+$/.test(query) &&
      card.number.includes(sanitizeCardNumber(query)))
  );
};
