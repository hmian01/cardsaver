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
    description: 'moms chase freedom',
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
    description: 'sapphire',
    cardholder: 'Alexis Taylor',
    number: '379354082930004',
    expiry: '11/25',
    cvv: '889',
    brand: 'AMEX',
    variant: 'jade',
  },
  {
    id: 'other',
    description: 'prime visa',
    cardholder: 'Alexis Taylor',
    number: '379354082930004',
    expiry: '11/25',
    cvv: '889',
    brand: 'OTHER',
    variant: 'jade',
  },
];

const listeners = new Set<Listener>();

const notify = () => {
  const snapshot = [...cards];
  listeners.forEach((listener) => listener(snapshot));
};

export const cardsStore = {
  getCards: () => [...cards],
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
};
