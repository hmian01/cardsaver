import AsyncStorage from '@react-native-async-storage/async-storage';

export type CardVariant = 'midnight' | 'sunset' | 'jade';

export type StoredCard = {
  id: string;
  description: string;
  cardholder: string;
  number: string;
  expiry: string;
  brand: string;
  cvv?: string;
  variant: CardVariant;
};

export type CardFormData = Omit<StoredCard, 'id'>;

type Listener = (cards: StoredCard[]) => void;

const STORAGE_KEY = '@cardsaver/cards';

const DEFAULT_CARDS: StoredCard[] = [
  {
    id: 'primary',
    description: 'chase freedom',
    cardholder: 'Alexis Taylor',
    number: '4111111111114242',
    expiry: '08/27',
    cvv: '613',
    brand: 'VISA',
    variant: 'midnight',
  },
  {
    id: 'travel',
    description: 'apple card',
    cardholder: 'Alexis Taylor',
    number: '5555444433331111',
    expiry: '02/26',
    cvv: '889',
    brand: 'MASTERCARD',
    variant: 'sunset',
  },
  {
    id: 'business',
    description: 'amex biz gold',
    cardholder: 'Alexis Taylor',
    number: '379354082930004',
    expiry: '11/25',
    cvv: '889',
    brand: 'AMEX',
    variant: 'jade',
  },
  {
    id: 'other',
    description: 'discover card',
    cardholder: 'Alexis Taylor',
    number: '6279354082930004',
    expiry: '11/25',
    cvv: '889',
    brand: 'OTHER',
    variant: 'midnight',
  },
];

let cards: StoredCard[] = [...DEFAULT_CARDS];

const listeners = new Set<Listener>();
let hasHydratedFromStorage = false;
let localMutationDuringHydration = false;

const notify = () => {
  const snapshot = [...cards];
  listeners.forEach((listener) => listener(snapshot));
};

const setCards = (nextCards: StoredCard[]) => {
  cards = nextCards;
  notify();
};

const persistCards = (nextCards: StoredCard[]) => {
  setCards(nextCards);
  const payload = JSON.stringify(nextCards);
  AsyncStorage.setItem(STORAGE_KEY, payload).catch((error) => {
    console.error('Failed to persist cards', error);
  });
  if (!hasHydratedFromStorage) {
    localMutationDuringHydration = true;
  }
};

const requiredStringProps = [
  'id',
  'description',
  'cardholder',
  'number',
  'expiry',
  'brand',
  'variant',
] as const;

const isStoredCardArray = (value: unknown): value is StoredCard[] => {
  if (!Array.isArray(value)) return false;
  return value.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Record<string, unknown>;
    const hasRequiredStrings = requiredStringProps.every(
      (prop) => typeof candidate[prop] === 'string',
    );
    if (!hasRequiredStrings) return false;
    const cvvValue = candidate.cvv;
    if (cvvValue !== undefined && typeof cvvValue !== 'string') {
      return false;
    }
    return true;
  });
};

const hydrateCards = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      if (localMutationDuringHydration) {
        return;
      }
      const parsed = JSON.parse(stored);
      if (isStoredCardArray(parsed)) {
        setCards(parsed);
        return;
      }
      console.warn('Stored cards data invalid. Resetting to defaults.');
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (error) {
    console.error('Failed to hydrate cards store', error);
  } finally {
    hasHydratedFromStorage = true;
  }
};

export const cardsStore = {
  getCards: () => [...cards],
  getCardById: (id: string) => cards.find((card) => card.id === id),
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    listener([...cards]);
    return () => listeners.delete(listener);
  },
  addCard: (data: CardFormData) => {
    const newCard: StoredCard = {
      ...data,
      id: `card-${Date.now()}`,
    };
    persistCards([...cards, newCard]);
  },
  updateCard: (id: string, data: Omit<CardFormData, 'variant'> & { variant?: CardVariant }) => {
    persistCards(
      cards.map((card) =>
        card.id === id
          ? {
              ...card,
              ...data,
              variant: data.variant ?? card.variant,
            }
          : card,
      ),
    );
  },
  removeCard: (id: string) => {
    persistCards(cards.filter((card) => card.id !== id));
  },
};

void hydrateCards();
