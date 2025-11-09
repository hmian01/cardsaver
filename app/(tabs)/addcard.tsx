import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';


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

  const handleSubmit = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!form.description.trim() || !form.cardholder.trim() || !form.number.trim()) {
      Alert.alert('Missing info', 'Please fill out description, cardholder, and card number.');
      return;
    }

    cardsStore.addCard(form);
    router.push('/(tabs)/cards');
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back()
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.headerRow}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={handleBack}
          >
            <MaterialIcons size={28} color="#fff" name="arrow-back" />
          </Pressable>
          <Text style={styles.heading}>Card Details</Text>
        </View>

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

        <Text style={styles.label}>Card Number</Text>
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
          <Text style={styles.submitText}>Add Card</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30
  },
  container: {
    marginTop: 50,
    padding: 24,
    paddingBottom: 48,
  },
  heading: {
    fontSize: 30,
    fontFamily: Fonts.rounded,
    color: '#fff',
    marginRight: 90,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    letterSpacing: 0.5,
    marginBottom: 5
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
    marginBottom: 15
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
    marginTop: 30,
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  backButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    transform: [{ scale: 0.96 }],
  },
});
