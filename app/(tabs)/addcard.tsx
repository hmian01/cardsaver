import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { Fonts } from '@/constants/theme';
import { cardsStore, type CardVariant } from '@/store/cardsStore';

const VARIANT_OPTIONS: CardVariant[] = ['midnight', 'sunset', 'jade'];

type FormState = {
  description: string;
  cardholder: string;
  number: string;
  expiry: string;
  cvv: string;
};

const sanitizeNumber = (value: string) => value.replace(/\D/g, '');

const detectBrand = (digits: string): string => {
  if (!digits) return 'OTHER';
  const first = digits[0];
  if (first === '3') return 'AMEX';
  if (first === '4') return 'VISA';
  if (first === '5') return 'MASTERCARD';
  return 'OTHER';
};

const limitDigitsForBrand = (digits: string, brand: string) =>
  brand === 'AMEX' ? digits.slice(0, 15) : digits.slice(0, 16);

const formatCardNumber = (digits: string, isAmex: boolean) => {
  if (!digits) return '';
  if (isAmex) {
    const part1 = digits.slice(0, 4);
    const part2 = digits.slice(4, 10);
    const part3 = digits.slice(10, 15);
    return [part1, part2, part3].filter(Boolean).join(' ');
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

const formatExpiryInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 6)}`;
};

const normalizeExpiry = (value: string): string | null => {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return null;
  const month = digits.slice(0, 2);
  const monthNum = parseInt(month, 10);
  if (Number.isNaN(monthNum) || monthNum < 1 || monthNum > 12) return null;
  let year = digits.slice(2);
  if (year.length === 2) {
    return `${month}/${year}`;
  }
  if (year.length === 4) {
    return `${month}/${year.slice(2)}`;
  }
  return null;
};

const isValidCvv = (value: string) => value.length === 3 || value.length === 4;

const getRandomVariant = () => VARIANT_OPTIONS[Math.floor(Math.random() * VARIANT_OPTIONS.length)];

const BRAND_LOGOS = {
  VISA: require('@/assets/images/visa-logo.png'),
  MASTERCARD: require('@/assets/images/mastercard-logo.png'),
  AMEX: require('@/assets/images/amex-logo.png'),
  OTHER: require('@/assets/images/other-logo.png'),
} as const;

export default function AddCardScreen() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    description: '',
    cardholder: '',
    number: '',
    expiry: '',
    cvv: '',
  });

  const detectedBrand = useMemo(() => {
    const digits = sanitizeNumber(form.number);
    return detectBrand(digits);
  }, [form.number]);

  const brandLogo = BRAND_LOGOS[detectedBrand as keyof typeof BRAND_LOGOS];

  const handleNumberChange = (value: string) => {
    const digits = sanitizeNumber(value);
    const brandGuess = detectBrand(digits);
    const limitedDigits = limitDigitsForBrand(digits, brandGuess);
    const formatted = formatCardNumber(limitedDigits, brandGuess === 'AMEX');
    setForm((prev) => ({ ...prev, number: formatted }));
  };

  const handleExpiryChange = (value: string) => {
    setForm((prev) => ({ ...prev, expiry: formatExpiryInput(value) }));
  };

  const handleCvvChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setForm((prev) => ({ ...prev, cvv: digits }));
  };

  

  const handleSubmit = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const description = form.description.trim();
    const cardholder = form.cardholder.trim();
    const digits = sanitizeNumber(form.number);
    const brand = detectBrand(digits);
    const normalizedExpiry = normalizeExpiry(form.expiry);

    if (!description || !cardholder) {
      Alert.alert('Missing info', 'Please add a nickname and cardholder name.');
      return;
    }

    if (brand === 'AMEX') {
      if (digits.length !== 15) {
        Alert.alert('Card number', 'AMEX numbers must be 15 digits.');
        return;
      }
    } else if (digits.length !== 16) {
      Alert.alert('Card number', 'Card numbers must be 16 digits.');
      return;
    }

    if (!normalizedExpiry) {
      Alert.alert('Expiry', 'Please enter expiry as MM/YY or MM/YYYY.');
      return;
    }

    if (!isValidCvv(form.cvv)) {
      Alert.alert('CVV', 'Security code must be 3 or 4 digits.');
      return;
    }

    const variant = getRandomVariant();

    cardsStore.addCard({
      description,
      cardholder,
      number: digits,
      expiry: normalizedExpiry,
      cvv: form.cvv,
      brand,
      variant,
    });

    router.push('/(tabs)/cards');
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            onPress={handleBack}
          >
            <MaterialIcons size={24} color="#fff" name="arrow-back" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.heading}>New card</Text>
            <Text style={styles.subheading}>Store a payment method securely</Text>
          </View>
        </View>

        <View style={styles.cardPreview}>
          <View style={styles.nicknameLogoRow}>
            <Text style={styles.previewTitle}>{form.description || 'Card nickname'}</Text>
            <View style={styles.branding}>
              <Image source={brandLogo} style={styles.logoImage}  resizeMode="contain"/>
            </View>
          </View>
          <Text style={styles.previewNumber}>{form.number || '•••• •••• •••• ••••'}</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Cardholder</Text>
              <Text style={styles.previewLabel}>Exp</Text>
              <Text style={styles.previewLabel}>CVV</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewValue}>
              {(form.cardholder || 'Your Name').toUpperCase()}
            </Text>
            <View style={styles.expCvvRow}>
              <Text style={styles.previewValue}>{form.expiry || 'MM/YY'}</Text>
              <Text style={styles.previewValue}>{form.cvv || '***'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formLabel}>Nickname</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Travel Visa"
            placeholderTextColor="#8C93AD"
            value={form.description}
            onChangeText={(text) => setForm((prev) => ({ ...prev, description: text }))}
          />

          <Text style={styles.formLabel}>Name on card</Text>
          <TextInput
            style={styles.input}
            placeholder="Alexis Taylor"
            placeholderTextColor="#8C93AD"
            value={form.cardholder}
            onChangeText={(text) => setForm((prev) => ({ ...prev, cardholder: text }))}
            autoCapitalize="words"
          />

          <Text style={styles.formLabel}>Card number</Text>
          <TextInput
            style={styles.input}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor="#8C93AD"
            keyboardType="number-pad"
            value={form.number}
            onChangeText={handleNumberChange}
            maxLength={detectedBrand === 'AMEX' ? 17 : 19}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.formLabel}>Expiry</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/YY"
                placeholderTextColor="#8C93AD"
                keyboardType="number-pad"
                value={form.expiry}
                onChangeText={handleExpiryChange}
                maxLength={7}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.formLabel}>CVV</Text>
              <TextInput
                style={styles.input}
                placeholder="123"
                placeholderTextColor="#8C93AD"
                keyboardType="number-pad"
                value={form.cvv}
                onChangeText={handleCvvChange}
                maxLength={4}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.submit} onPress={handleSubmit}>
            <Text style={styles.submitText}>Save card</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    marginTop: 40,
    flex: 1,
    backgroundColor: '#050710',
  },
  container: {
    padding: 24,
    paddingBottom: 80,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  heading: {
    fontSize: 28,
    color: '#fff',
    fontFamily: Fonts.rounded,
  },
  subheading: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    transform: [{ scale: 0.95 }],
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(158,224,255,0.12)',
    gap: 6,
  },
  brandBadgeText: {
    color: '#9EE0FF',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  cardPreview: {
    backgroundColor: '#111428',
    borderRadius: 24,
    padding: 24,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  previewTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  previewNumber: {
    color: '#fff',
    fontSize: 22,
    letterSpacing: 2,
    fontFamily: Fonts.mono,
    marginTop: 20,
    marginBottom: 15,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  expCvvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 80
  },
  previewLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  previewValue: {
    color: '#fff',
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#0F1324',
    borderRadius: 24,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  formLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
    marginTop: 6,
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  submit: {
    marginTop: 10,
    backgroundColor: '#A5F276',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: {
    color: '#050710',
    fontSize: 16,
    fontWeight: '700',
  },
  nicknameLogoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 70,
    height: 35,
    marginLeft: 12,
  },
});
