import { detectBrand, type CardBrand } from './cardNumber';

export type CardProduct = {
  id: string;
  issuer: string;
  name: string;
  kind: 'credit' | 'debit';
  networks: readonly CardBrand[];
  aliases: readonly string[];
  background: string;
  light?: boolean;
};

// Product names and OCR are evidence of a product; a payment-network prefix isn't.
// Keep IDs stable: saved cards and portable backups refer to these entries.
export const CARD_PRODUCTS: readonly CardProduct[] = [
  {
    id: 'chime-debit',
    issuer: 'Chime',
    name: 'Debit',
    kind: 'debit',
    networks: ['VISA'],
    aliases: ['chime debit', 'chime visa debit', 'chime checking'],
    background: '#F5F6F5',
    light: true,
  },
  {
    id: 'fidelity-hsa',
    issuer: 'Fidelity',
    name: 'HSA Debit',
    kind: 'debit',
    networks: ['VISA'],
    aliases: [
      'fidelity hsa',
      'fidelity health savings account',
      'fidelity hsa debit',
    ],
    background: '#176A49',
  },
  {
    id: 'us-bank-business-debit',
    issuer: 'U.S. Bank',
    name: 'Business Debit',
    kind: 'debit',
    networks: ['VISA'],
    aliases: [
      'us bank business debit',
      'u s bank business debit',
      'usbank business debit',
      'us bank business checking',
    ],
    background: '#16416B',
    light: true,
  },
  {
    id: 'bofa-atmos-ascent',
    issuer: 'Bank of America',
    name: 'Atmos Rewards Ascent',
    kind: 'credit',
    networks: ['VISA'],
    aliases: [
      'atmos ascent',
      'atmos rewards ascent',
      'bofa atmos ascent',
      'bank of america atmos ascent',
    ],
    background: '#192C52',
  },
  {
    id: 'associated-business-debit',
    issuer: 'Associated Bank',
    name: 'Business Debit',
    kind: 'debit',
    networks: ['MASTERCARD'],
    aliases: [
      'associated business',
      'associated bank business',
      'associated business debit',
      'associated bank business debit',
    ],
    background: '#C8CCCD',
    light: true,
  },
  {
    id: 'citi-aadvantage-platinum-select',
    issuer: 'Citi',
    name: 'AAdvantage Platinum Select',
    kind: 'credit',
    networks: ['MASTERCARD'],
    aliases: [
      'citi aadvantage platinum select',
      'aadvantage platinum select',
      'citi aa platinum select',
      'american airlines platinum select',
    ],
    background: '#737E84',
    light: true,
  },
  {
    id: 'amex-white-gold',
    issuer: 'American Express',
    name: 'White Gold',
    kind: 'credit',
    networks: ['AMEX'],
    aliases: [
      'amex white gold',
      'american express white gold',
      'white gold american express',
    ],
    background: '#D9D3BC',
    light: true,
  },
  {
    id: 'sofi-debit',
    issuer: 'SoFi',
    name: 'Debit',
    kind: 'debit',
    networks: ['MASTERCARD'],
    aliases: ['sofi debit', 'sofi world debit', 'sofi checking'],
    background: '#DDE7EC',
    light: true,
  },
  {
    id: 'chase-prime-visa',
    issuer: 'Chase',
    name: 'Prime Visa',
    kind: 'credit',
    networks: ['VISA'],
    aliases: [
      'chase prime',
      'prime visa',
      'amazon prime visa',
      'chase amazon prime',
    ],
    background: '#0C2739',
  },
  {
    id: 'chase-debit',
    issuer: 'Chase',
    name: 'Debit',
    kind: 'debit',
    networks: ['VISA'],
    aliases: ['chase debit', 'chase checking', 'chase total checking'],
    background: '#073A70',
  },
  {
    id: 'chase-business-debit',
    issuer: 'Chase',
    name: 'Business Debit',
    kind: 'debit',
    networks: ['VISA'],
    aliases: ['chase business debit', 'chase business checking'],
    background: '#263B4B',
  },
  {
    id: 'chase-freedom-unlimited',
    issuer: 'Chase',
    name: 'Freedom Unlimited',
    kind: 'credit',
    networks: ['VISA'],
    aliases: ['freedom unlimited', 'chase cfu'],
    background: '#164B78',
  },
  {
    id: 'chase-sapphire-preferred',
    issuer: 'Chase',
    name: 'Sapphire Preferred',
    kind: 'credit',
    networks: ['VISA'],
    aliases: ['sapphire preferred', 'chase csp'],
    background: '#082C4C',
  },
  {
    id: 'chase-sapphire-reserve',
    issuer: 'Chase',
    name: 'Sapphire Reserve',
    kind: 'credit',
    networks: ['VISA'],
    aliases: ['sapphire reserve', 'chase csr'],
    background: '#172638',
  },
  {
    id: 'chase-freedom-flex',
    issuer: 'Chase',
    name: 'Freedom Flex',
    kind: 'credit',
    networks: ['MASTERCARD'],
    aliases: ['freedom flex', 'chase cff'],
    background: '#056A98',
  },
  {
    id: 'chase-ink-unlimited',
    issuer: 'Chase',
    name: 'Ink Business Unlimited',
    kind: 'credit',
    networks: ['VISA'],
    aliases: [
      'ink business unlimited',
      'ink unlimited',
      'chase business unlimited',
    ],
    background: '#183D5B',
  },
  {
    id: 'chase-ink-cash',
    issuer: 'Chase',
    name: 'Ink Business Cash',
    kind: 'credit',
    networks: ['VISA'],
    aliases: ['ink business cash', 'ink cash', 'chase business cash'],
    background: '#183D5B',
  },
  {
    id: 'chase-ink-preferred',
    issuer: 'Chase',
    name: 'Ink Business Preferred',
    kind: 'credit',
    networks: ['VISA'],
    aliases: [
      'ink business preferred',
      'ink preferred',
      'chase business preferred',
    ],
    background: '#193E66',
  },
  {
    id: 'chase-ink-premier',
    issuer: 'Chase',
    name: 'Ink Business Premier',
    kind: 'credit',
    networks: ['VISA'],
    aliases: ['ink business premier', 'ink premier', 'chase business premier'],
    background: '#24282D',
  },
  {
    id: 'amex-gold',
    issuer: 'American Express',
    name: 'Gold',
    kind: 'credit',
    networks: ['AMEX'],
    aliases: ['amex gold', 'american express gold', 'gold american express'],
    background: '#BBA55E',
    light: true,
  },
  {
    id: 'amex-platinum',
    issuer: 'American Express',
    name: 'Platinum',
    kind: 'credit',
    networks: ['AMEX'],
    aliases: [
      'amex platinum',
      'american express platinum',
      'platinum american express',
    ],
    background: '#BBBFBE',
    light: true,
  },
  {
    id: 'amex-blue-business-plus',
    issuer: 'American Express',
    name: 'Blue Business Plus',
    kind: 'credit',
    networks: ['AMEX'],
    aliases: [
      'blue business plus',
      'blue biz plus',
      'amex bbp',
      'american express business plus',
      'amex business plus',
    ],
    background: '#23619A',
  },
  {
    id: 'amex-blue-business-cash',
    issuer: 'American Express',
    name: 'Blue Business Cash',
    kind: 'credit',
    networks: ['AMEX'],
    aliases: ['blue business cash', 'blue biz cash', 'amex bbc'],
    background: '#2B587A',
  },
  {
    id: 'capital-one-debit',
    issuer: 'Capital One',
    name: '360 Debit',
    kind: 'debit',
    networks: ['MASTERCARD', 'DISCOVER'],
    aliases: [
      'capital one debit',
      'capital one 360',
      '360 checking',
      '360 debit',
    ],
    background: '#073657',
  },
  {
    id: 'capital-one-venture',
    issuer: 'Capital One',
    name: 'Venture',
    kind: 'credit',
    networks: ['VISA', 'MASTERCARD', 'DISCOVER'],
    aliases: ['capital one venture', 'venture'],
    background: '#155078',
  },
  {
    id: 'capital-one-venture-x',
    issuer: 'Capital One',
    name: 'Venture X',
    kind: 'credit',
    networks: ['VISA'],
    aliases: ['venture x', 'venturex'],
    background: '#102F46',
  },
  {
    id: 'capital-one-ventureone',
    issuer: 'Capital One',
    name: 'VentureOne',
    kind: 'credit',
    networks: ['VISA', 'MASTERCARD', 'DISCOVER'],
    aliases: ['ventureone', 'venture one'],
    background: '#143F63',
  },
  {
    id: 'capital-one-quicksilver',
    issuer: 'Capital One',
    name: 'Quicksilver',
    kind: 'credit',
    networks: ['VISA', 'MASTERCARD', 'DISCOVER'],
    aliases: ['quicksilver', 'quick silver'],
    background: '#6D7B85',
    light: true,
  },
  {
    id: 'capital-one-savor',
    issuer: 'Capital One',
    name: 'Savor',
    kind: 'credit',
    networks: ['MASTERCARD', 'DISCOVER'],
    aliases: ['savor'],
    background: '#AB4F2D',
  },
  {
    id: 'capital-one-savorone',
    issuer: 'Capital One',
    name: 'SavorOne',
    kind: 'credit',
    networks: ['MASTERCARD', 'DISCOVER'],
    aliases: ['savorone', 'savor one'],
    background: '#AB4F2D',
  },
  {
    id: 'wells-fargo-debit',
    issuer: 'Wells Fargo',
    name: 'Debit',
    kind: 'debit',
    networks: ['VISA'],
    aliases: ['wells fargo debit', 'wells debit', 'wells fargo checking'],
    background: '#A51D29',
  },
  {
    id: 'wells-fargo-business-debit',
    issuer: 'Wells Fargo',
    name: 'Business Debit',
    kind: 'debit',
    networks: ['VISA'],
    aliases: [
      'wells fargo business debit',
      'wells business debit',
      'wells fargo business checking',
    ],
    background: '#454548',
  },
];

export const getCardProduct = (id?: string | null) =>
  CARD_PRODUCTS.find((product) => product.id === id);
export const productLabel = (product: CardProduct) =>
  `${product.issuer} ${product.name}`;
export const normalizeProductText = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&(?:#x20|nbsp);/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const contains = (text: string, phrase: string) =>
  ` ${text} `.includes(` ${normalizeProductText(phrase)} `);

export const productSupportsNumber = (product: CardProduct, number = '') => {
  const network = detectBrand(number);
  return network === 'OTHER' || product.networks.includes(network);
};

export function detectCardProduct(
  text: string,
  number = '',
): CardProduct | undefined {
  const normalized = normalizeProductText(text).replace(/\bbiz\b/g, 'business');
  // Unsupported variants must not silently turn into a similarly named personal card.
  if (
    /\b(delta|skymiles|hilton|marriott|corporate|centurion|quicksilver\s*one|quick silver one)\b/.test(
      normalized,
    )
  )
    return undefined;
  const issuers = [
    ['Chase', ['chase']],
    ['American Express', ['american express', 'amex']],
    ['Capital One', ['capital one']],
    ['Wells Fargo', ['wells fargo', 'wells']],
    ['Chime', ['chime']],
    ['Fidelity', ['fidelity']],
    ['U.S. Bank', ['us bank', 'u s bank', 'usbank']],
    ['Bank of America', ['bank of america', 'bofa']],
    ['Associated Bank', ['associated bank', 'associated']],
    ['Citi', ['citi', 'citibank']],
    ['SoFi', ['sofi']],
  ] as const;
  const mentioned = issuers.filter(([, aliases]) =>
    aliases.some((alias) => contains(normalized, alias)),
  );
  if (mentioned.length > 1) return undefined;
  const candidates = CARD_PRODUCTS.flatMap((product) => {
    if (mentioned.length && mentioned[0][0] !== product.issuer) return [];
    if (!productSupportsNumber(product, number)) return [];
    if (
      contains(normalized, 'business') &&
      !contains(product.name.toLowerCase(), 'business')
    )
      return [];
    if (contains(normalized, 'debit') && product.kind !== 'debit') return [];
    const aliases = [productLabel(product), ...product.aliases];
    const matched = aliases.filter((alias) => contains(normalized, alias));
    return matched.length ? [{ product, matched }] : [];
  });
  // Short base names can be part of a longer product (Venture / Venture X).
  // Two independent product mentions are ambiguous, regardless of alias length.
  const specific = candidates.filter(
    (candidate) =>
      !candidates.some(
        (other) =>
          candidate !== other &&
          candidate.matched.some((alias) =>
            other.matched.some(
              (longer) =>
                normalizeProductText(longer).length >
                  normalizeProductText(alias).length &&
                contains(normalizeProductText(longer), alias),
            ),
          ),
      ),
  );
  return specific.length === 1 ? specific[0].product : undefined;
}

export type CardIdentityInput = {
  number: string;
  description: string;
  productId?: string;
  artwork?: 'auto' | 'color';
};
export function resolveCardIdentity(card: CardIdentityInput) {
  const selected = getCardProduct(card.productId);
  const product = card.productId
    ? selected && productSupportsNumber(selected, card.number)
      ? selected
      : undefined
    : detectCardProduct(card.description, card.number);
  const detected = detectBrand(card.number);
  return {
    product,
    network:
      detected === 'OTHER' && !card.number && product?.networks.length === 1
        ? product.networks[0]
        : detected,
    source: product
      ? card.productId
        ? ('selected' as const)
        : ('name' as const)
      : ('network' as const),
    useArtwork: Boolean(product && card.artwork !== 'color'),
  };
}
