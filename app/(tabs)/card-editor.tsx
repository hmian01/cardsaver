import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Fonts } from '@/constants/theme';
import { cardsStore, type CardVariant, type StoredCard } from '@/store/cardsStore';
import { settingsStore } from '@/store/settingsStore';
import {
  detectBrand,
  formatCardNumber,
  limitDigitsForBrand,
  sanitizeCardNumber,
  type CardBrand,
} from '@/utils/cardNumber';

const VARIANT_OPTIONS: CardVariant[] = ['midnight', 'sunset', 'jade'];

type FormState = {
  description: string;
  cardholder: string;
  number: string;
  expiry: string;
  cvv: string;
};

const DEFAULT_FORM: FormState = {
  description: '',
  cardholder: '',
  number: '',
  expiry: '',
  cvv: '',
};

const BRAND_LOGOS: Record<CardBrand, ImageSourcePropType> = {
  VISA: require('@/assets/images/visa-logo.png'),
  MASTERCARD: require('@/assets/images/mastercard-logo.png'),
  AMEX: require('@/assets/images/amex-logo.png'),
  DISCOVER: require('@/assets/images/other-logo.png'),
  OTHER: require('@/assets/images/other-logo.png'),
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
  const monthNum = Number(month);
  if (!month || Number.isNaN(monthNum) || monthNum < 1 || monthNum > 12) return null;

  const year = digits.slice(2);
  if (year.length === 2) {
    return `${month}/${year}`;
  }
  if (year.length === 4) {
    return `${month}/${year.slice(2)}`;
  }
  return null;
};

const isValidCvv = (value: string) => value.length === 3 || value.length === 4;

let lastVariant: CardVariant | null = null;
const getRandomVariant = () => {
  const pool = lastVariant ? VARIANT_OPTIONS.filter((variant) => variant !== lastVariant) : VARIANT_OPTIONS;
  const options = pool.length > 0 ? pool : VARIANT_OPTIONS;
  const variant = options[Math.floor(Math.random() * options.length)];
  lastVariant = variant;
  return variant;
};

const buildFormFromCard = (card?: StoredCard): FormState => {
  if (!card) return DEFAULT_FORM;
  const normalizedBrand = (card.brand?.toUpperCase?.() as CardBrand) ?? 'OTHER';
  return {
    description: card.description,
    cardholder: card.cardholder,
    number: formatCardNumber(card.number, normalizedBrand),
    expiry: card.expiry,
    cvv: card.cvv ?? '',
  };
};

export default function CardEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ cardId?: string; returnTo?: string; prefillNumber?: string }>();
  const cardId = typeof params.cardId === 'string' ? params.cardId : undefined;
  const returnTo =
    typeof params.returnTo === 'string' ? decodeURIComponent(params.returnTo) : undefined;
  const existingCard = cardId ? cardsStore.getCardById(cardId) : undefined;
  const isEditing = Boolean(cardId && existingCard);
  const prefillDigits =
    typeof params.prefillNumber === 'string' ? sanitizeCardNumber(params.prefillNumber) : '';

  const [defaultCardholder, setDefaultCardholder] = useState(
    () => settingsStore.getSettings().defaultCardholder,
  );

  useEffect(() => {
    const unsubscribe = settingsStore.subscribe((next) => {
      setDefaultCardholder(next.defaultCardholder);
    });
    return unsubscribe;
  }, []);

  const buildEmptyForm = useCallback((): FormState => {
    return {
      ...DEFAULT_FORM,
      cardholder: defaultCardholder || '',
    };
  }, [defaultCardholder]);

  const buildPrefilledForm = useCallback((): FormState => {
    const base = buildEmptyForm();
    if (!prefillDigits) {
      return base;
    }
    const brandFromPrefill = detectBrand(prefillDigits);
    const limited = limitDigitsForBrand(prefillDigits, brandFromPrefill);
    return {
      ...base,
      number: formatCardNumber(limited, brandFromPrefill),
    };
  }, [buildEmptyForm, prefillDigits]);

  const [form, setForm] = useState<FormState>(() =>
    existingCard ? buildFormFromCard(existingCard) : buildPrefilledForm(),
  );

  useFocusEffect(
    useCallback(() => {
      if (cardId) {
        const latestCard = cardsStore.getCardById(cardId);
        if (latestCard) {
          setForm(buildFormFromCard(latestCard));
        } else {
          Alert.alert('Card not found', 'The card you are trying to edit no longer exists.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        }
      } else {
        setForm(buildPrefilledForm());
      }
    }, [buildPrefilledForm, cardId, router]),
  );

  const detectedBrand = useMemo(() => {
    const digits = sanitizeCardNumber(form.number);
    return detectBrand(digits);
  }, [form.number]);

  const brandLogo = BRAND_LOGOS[detectedBrand];

  const handleNumberChange = (value: string) => {
    const digits = sanitizeCardNumber(value);
    const brandGuess = detectBrand(digits);
    const limitedDigits = limitDigitsForBrand(digits, brandGuess);
    const formatted = formatCardNumber(limitedDigits, brandGuess);
    setForm((prev) => ({ ...prev, number: formatted }));
  };

  const handleExpiryChange = (value: string) => {
    setForm((prev) => ({ ...prev, expiry: formatExpiryInput(value) }));
  };

  const handleCvvChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setForm((prev) => ({ ...prev, cvv: digits }));
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (returnTo && typeof returnTo === 'string') {
      router.replace(returnTo as unknown as any);
    } else {
      router.replace('/(tabs)/cards');
    }
  };

  const handleSubmit = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const description = form.description.trim();
    const cardholder = form.cardholder.trim();
    const digits = sanitizeCardNumber(form.number);
    const brand = detectBrand(digits);
    const normalizedExpiry = normalizeExpiry(form.expiry);

    if (!description || !cardholder) {
      Alert.alert('Missing info', 'Please add a nickname and cardholder name.');
      return;
    }

    if (brand === 'AMEX') {
      if (digits.length !== 15) {
        Alert.alert('Card number', 'American Express numbers must be 15 digits.');
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

    if (isEditing && existingCard) {
      cardsStore.updateCard(existingCard.id, {
        description,
        cardholder,
        number: digits,
        expiry: normalizedExpiry,
        cvv: form.cvv,
        brand,
        variant: existingCard.variant,
      });
    } else {
      cardsStore.addCard({
        description,
        cardholder,
        number: digits,
        expiry: normalizedExpiry,
        cvv: form.cvv,
        brand,
        variant: getRandomVariant(),
      });
    }

    router.push('/(tabs)/cards');
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            onPress={handleBack}
            hitSlop={30}
          >
            <MaterialIcons size={22} color="#fff" name="arrow-back" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.heading}>{isEditing ? 'Edit card' : 'Add new card'}</Text>
            <Text style={styles.subheading}>
              {isEditing ? 'Update details securely' : 'Store a payment method securely'}
            </Text>
          </View>
        </View>

        <View style={styles.cardPreview}>
          <View style={styles.previewTopRow}>
            <Text style={styles.previewTitle} numberOfLines={1} ellipsizeMode="tail">
              {form.description || 'Card nickname'}
            </Text>
            <Image source={brandLogo} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.previewNumber}>{form.number || '•••• •••• •••• ••••'}</Text>
          <View style={styles.previewRowLabels}>
              <Text style={styles.previewLabel}>Cardholder</Text>
              <Text style={[styles.previewLabel, styles.expirylabel]}>Expires</Text>
              <Text style={styles.previewLabel}>CVV</Text>
          </View>
          <View style={styles.previewRowValues}>
            <Text style={[styles.previewValue, styles.previewCardholder]} numberOfLines={1} ellipsizeMode="tail">
              {(form.cardholder || 'Your Name').toUpperCase()}
            </Text>
            <View style={styles.expCvvValues}>
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
                style={[styles.input, styles.ExpCvvInput]}
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
                style={[styles.input, styles.ExpCvvInput]}
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
            <Text style={styles.submitText}>{isEditing ? 'Save changes' : 'Save card'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050710',
    marginTop: 50,
  },
  container: {
    padding: 24,
    paddingBottom: 100,
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
    borderRadius: 26,
    padding: 24,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  previewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    width: 230
  },
  logoImage: {
    width: 64,
    height: 28,
  },
  previewNumber: {
    marginTop: 20,
    color: '#fff',
    fontSize: 22,
    letterSpacing: 2,
    fontFamily: Fonts.mono,
  },
  previewRowLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  previewRowValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  expCvvLabels: {

  },
  expCvvValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 50,
    marginLeft: 30
  },
  expirylabel: {
    marginLeft: 70
  },
  previewLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  previewValue: {
    color: '#fff',
    fontWeight: '600',
  },
  previewCardholder: {
    width: 150
  },
  formCard: {
    backgroundColor: '#0F1324',
    borderRadius: 26,
    padding: 20,
    gap: 6,
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
    marginTop: 2,
    marginBottom: 10
  },
  ExpCvvInput: {
    marginTop: 6,
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  submit: {
    marginTop: 16,
    backgroundColor: '#A5F276',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: {
    color: '#050710',
    fontSize: 16,
    fontWeight: '700',
  },
});
