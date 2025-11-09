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

let cards: StoredCard[] = [
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

const listeners = new Set<Listener>();

const notify = () => {
  const snapshot = [...cards];
  listeners.forEach((listener) => listener(snapshot));
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
    cards = [...cards, newCard];
    notify();
  },
  updateCard: (id: string, data: Omit<CardFormData, 'variant'> & { variant?: CardVariant }) => {
    cards = cards.map((card) =>
      card.id === id
        ? {
            ...card,
            ...data,
            variant: data.variant ?? card.variant,
          }
        : card,
    );
    notify();
  },
  removeCard: (id: string) => {
    cards = cards.filter((card) => card.id !== id);
    notify();
  },
};
