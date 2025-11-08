import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';


import { Fonts } from '@/constants/theme';

type CreditCardProps = {
  description: string;
  cardholder: string;
  number: string;
  expiry: string;
  brand: string;
  cvv?: string;
  variant?: keyof typeof CARD_VARIANTS;
};

const CARD_VARIANTS = {
  midnight: {
    background: '#111428',
    accent: 'rgba(78, 74, 255, 0.35)',
    accentSecondary: 'rgba(0, 212, 255, 0.25)',
  },
  sunset: {
    background: '#3D1C32',
    accent: 'rgba(255, 94, 58, 0.45)',
    accentSecondary: 'rgba(255, 195, 160, 0.35)',
  },
  jade: {
    background: '#0F2D2F',
    accent: 'rgba(35, 224, 178, 0.35)',
    accentSecondary: 'rgba(0, 116, 117, 0.35)',
  },
} as const;

const BRAND_LOGOS = {
  VISA: require('@/assets/images/visa-logo.png'),
  MASTERCARD: require('@/assets/images/mastercard-logo.png'),
  AMEX: require('@/assets/images/amex-logo.png'),
  OTHER: require('@/assets/images/other-logo.png'),
} as const;

const formatNumber = (number: string) => number.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();


export default function CreditCard({
  description,
  cardholder,
  number,
  expiry,
  brand = 'OTHER',
  cvv,
  variant = 'midnight',
}: CreditCardProps) {
  const palette = CARD_VARIANTS[variant];
  const brandLogo = BRAND_LOGOS[brand as keyof typeof BRAND_LOGOS];



  return (
    <View style={[styles.card, { backgroundColor: palette.background }]}>
      <View style={[styles.overlay, styles.overlayPrimary, { backgroundColor: palette.accent }]} />
      <View
        style={[styles.overlay, styles.overlaySecondary, { backgroundColor: palette.accentSecondary }]}
      />
      <View style={styles.row}>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.branding}>
          <Image source={brandLogo} style={styles.logoImage}  resizeMode="contain"/>
        </View>
      </View>

      <Text style={styles.number}>{formatNumber(number)}</Text>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Card Holder</Text>
          <Text style={styles.value}>{cardholder.toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.label}>Expires</Text>
          <Text style={styles.value}>{expiry}</Text>
        </View>
        <View>
          <Text style={styles.label}>CVV</Text>
          <Text style={styles.value}>{cvv}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 20,
    marginVertical: 12,
    width: '100%',
    aspectRatio: 1.586,
    overflow: 'hidden',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',

    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 18,
    elevation: 8,
  },
  overlay: {
    position: 'absolute',
    opacity: 0.8,
  },
  overlayPrimary: {
    width: '160%',
    height: '120%',
    top: -120,
    left: -40,
    transform: [{ rotate: '-12deg' }],
  },
  overlaySecondary: {
    width: '120%',
    height: '100%',
    bottom: -80,
    right: -60,
    transform: [{ rotate: '18deg' }],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  description: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  chip: {
    width: 48,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 70,
    height: 40,
    marginLeft: 12,
  },
  number: {
    color: '#fff',
    fontSize: 22,
    letterSpacing: 2,
    fontFamily: Fonts.mono,
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});
