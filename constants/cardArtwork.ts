import type { ImageSourcePropType } from 'react-native';

export type CardArt = {
  source: ImageSourcePropType;
  // Crop a card face out of a larger published illustration at display time.
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
    sourceWidth: number;
    sourceHeight: number;
  };
  hasNetworkLogo?: boolean;
  numberTop?: `${number}%`;
  numberRight?: number;
};

export const CARD_ARTWORK: Record<string, CardArt> = {
  'chime-debit': {
    source: require('../assets/card-art/chime-debit.webp'),
    hasNetworkLogo: true,
    crop: {
      x: 4,
      y: 0,
      width: 658,
      height: 415,
      sourceWidth: 664,
      sourceHeight: 664,
    },
  },
  'fidelity-hsa': {
    source: require('../assets/card-art/fidelity-hsa.png'),
    hasNetworkLogo: true,
  },
  'us-bank-business-debit': {
    source: require('../assets/card-art/us-bank-business-debit.png'),
    hasNetworkLogo: true,
  },
  'bofa-atmos-ascent': {
    source: require('../assets/card-art/bofa-atmos-ascent.png'),
    hasNetworkLogo: true,
  },
  'associated-business-debit': {
    source: require('../assets/card-art/associated-business-debit-clean.jpg'),
    hasNetworkLogo: true,
  },
  'citi-aadvantage-platinum-select': {
    source: require('../assets/card-art/citi-aadvantage-platinum-select-clean.jpg'),
    hasNetworkLogo: true,
  },
  'amex-white-gold': {
    source: require('../assets/card-art/amex-white-gold-clean.jpg'),
  },
  'sofi-debit': {
    source: require('../assets/card-art/sofi-debit.png'),
    hasNetworkLogo: true,
    crop: {
      x: 329,
      y: 349,
      width: 482,
      height: 304,
      sourceWidth: 1134,
      sourceHeight: 1134,
    },
  },
  'chase-prime-visa': {
    source: require('../assets/card-art/chase-prime-visa-clean.jpg'),
    hasNetworkLogo: true,
  },
  'chase-debit': {
    source: require('../assets/card-art/chase-debit-clean.jpg'),
    hasNetworkLogo: true,
  },
  'chase-business-debit': {
    source: require('../assets/card-art/chase-business-debit-clean.jpg'),
    hasNetworkLogo: true,
  },
  'chase-freedom-unlimited': {
    source: require('../assets/card-art/chase-freedom-unlimited-clean.jpg'),
    hasNetworkLogo: true,
  },
  'chase-freedom-flex': {
    source: require('../assets/card-art/chase-freedom-flex-clean.jpg'),
    hasNetworkLogo: true,
  },
  'chase-ink-unlimited': {
    source: require('../assets/card-art/chase-ink-unlimited-clean.jpg'),
    hasNetworkLogo: true,
    numberTop: '67%',
    numberRight: 100,
  },
  'chase-ink-cash': {
    source: require('../assets/card-art/chase-ink-cash-clean.jpg'),
    hasNetworkLogo: true,
    numberTop: '67%',
    numberRight: 100,
  },
  'chase-ink-preferred': {
    source: require('../assets/card-art/chase-ink-preferred-clean.jpg'),
    hasNetworkLogo: true,
    numberTop: '67%',
    numberRight: 100,
  },
  'chase-ink-premier': {
    source: require('../assets/card-art/chase-ink-premier-clean.jpg'),
    hasNetworkLogo: true,
    numberTop: '67%',
    numberRight: 100,
  },
  'wells-fargo-debit': {
    source: require('../assets/card-art/wells-fargo-debit-clean.jpg'),
    hasNetworkLogo: true,
  },
  'wells-fargo-business-debit': {
    source: require('../assets/card-art/wells-fargo-business-debit-clean.jpg'),
    hasNetworkLogo: true,
  },
  'chase-sapphire-preferred': {
    source: require('../assets/card-art/chase-sapphire-preferred.png'),
  },
  'chase-sapphire-reserve': {
    source: require('../assets/card-art/chase-sapphire-reserve.png'),
  },
  'capital-one-venture': {
    source: require('../assets/card-art/capital-one-venture.png'),
  },
  'capital-one-venture-x': {
    source: require('../assets/card-art/capital-one-venture-x.png'),
  },
  'capital-one-ventureone': {
    source: require('../assets/card-art/capital-one-ventureone.png'),
  },
  'capital-one-quicksilver': {
    source: require('../assets/card-art/capital-one-quicksilver.png'),
  },
  'capital-one-savor': {
    source: require('../assets/card-art/capital-one-savor.png'),
  },
  'capital-one-savorone': {
    source: require('../assets/card-art/capital-one-savorone.png'),
  },
  'amex-gold': { source: require('../assets/card-art/amex-gold-clean.jpg') },
  'amex-platinum': {
    source: require('../assets/card-art/amex-platinum-clean.jpg'),
  },
  'amex-blue-business-plus': {
    source: require('../assets/card-art/amex-blue-business-plus-clean.jpg'),
  },
  'amex-blue-business-cash': {
    source: require('../assets/card-art/amex-blue-business-cash-clean.jpg'),
  },
  'capital-one-debit': {
    source: require('../assets/card-art/capital-one-debit-flat.jpg'),
  },
};
