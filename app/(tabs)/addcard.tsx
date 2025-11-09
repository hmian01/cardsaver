import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { cardsStore, type CardFormData } from '@/store/cardsStore';
import { Fonts } from '@/constants/theme';

const VARIANT_OPTIONS: CardFormData['variant'][] = ['midnight', 'sunset', 'jade'];

export default function AddCardScreen() {
  const router = useRouter();
  const [form, setForm] = useState<CardFormData>({
    description: '',
    cardholder: '',
    number: '',
    expiry: '',
    cvv: '',
    brand: 'VISA',
    variant: 'midnight',
  });

  const handleChange = (field: keyof CardFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.description.trim() || !form.cardholder.trim() || !form.number.trim()) {
      Alert.alert('Missing info', 'Please fill out description, cardholder, and card number.');
      return;
    }

    cardsStore.addCard(form);
    router.push('/(tabs)/cards');
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Card Details</Text>

        <Text style={styles.label}>Nickname</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Travel Visa"
          placeholderTextColor="#9aa"
          value={form.description}
          onChangeText={(text) => handleChange('description', text)}
        />

        <Text style={styles.label}>Cardholder</Text>
        <TextInput
          style={styles.input}
          placeholder="Name on card"
          placeholderTextColor="#9aa"
          value={form.cardholder}
          onChangeText={(text) => handleChange('cardholder', text)}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Number</Text>
        <TextInput
          style={styles.input}
          placeholder="1234 5678 9012 3456"
          placeholderTextColor="#9aa"
          keyboardType="numeric"
          value={form.number}
          onChangeText={(text) => handleChange('number', text)}
        />

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Expiry</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/YY"
              placeholderTextColor="#9aa"
              value={form.expiry}
              onChangeText={(text) => handleChange('expiry', text)}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>CVV</Text>
            <TextInput
              style={styles.input}
              placeholder="123"
              placeholderTextColor="#9aa"
              keyboardType="numeric"
              value={form.cvv}
              onChangeText={(text) => handleChange('cvv', text)}
              maxLength={4}
            />
          </View>
        </View>

        <Text style={styles.label}>Brand</Text>
        <TextInput
          style={styles.input}
          placeholder="VISA, MASTERCARD, AMEX..."
          placeholderTextColor="#9aa"
          value={form.brand}
          onChangeText={(text) => handleChange('brand', text.toUpperCase())}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Design Variant</Text>
        <View style={styles.variantRow}>
          {VARIANT_OPTIONS.map((variant) => {
            const selected = form.variant === variant;
            return (
              <TouchableOpacity
                key={variant}
                style={[styles.variantChip, selected && styles.variantChipSelected]}
                onPress={() => handleChange('variant', variant)}
              >
                <Text style={[styles.variantText, selected && styles.variantTextSelected]}>
                  {variant}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.submit} onPress={handleSubmit}>
          <Text style={styles.submitText}>Save Card</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 90,
    padding: 24,
    paddingBottom: 48,
    gap: 16,
  },
  heading: {
    fontSize: 24,
    fontFamily: Fonts.rounded,
    color: '#fff',
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  col: {
    flex: 1,
  },
  variantRow: {
    flexDirection: 'row',
    gap: 10,
  },
  variantChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  variantChipSelected: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  variantText: {
    textTransform: 'capitalize',
    color: 'rgba(255,255,255,0.8)',
  },
  variantTextSelected: {
    color: '#111428',
    fontWeight: '600',
  },
  submit: {
    marginTop: 12,
    backgroundColor: '#4D7CFE',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
