import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import CreditCard from '@/components/creditcard';
import Toast from '@/components/toast';
import { Fonts } from '@/constants/theme';

export default function CardsScreen() {
  const [toastMessage, setToastMessage] = useState('');
  const pendingReset = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = (message: string) => {
    if (pendingReset.current) {
      clearTimeout(pendingReset.current);
    }
    setToastMessage('');
    pendingReset.current = setTimeout(() => {
      setToastMessage(message);
      pendingReset.current = null;
    }, 0);
  };

  useEffect(() => {
    return () => {
      if (pendingReset.current) {
        clearTimeout(pendingReset.current);
      }
    };
  }, []);

  const handleCopy = () => {
    triggerToast(`Copied To Clipboard`);
  };

  const cards = [
    {
      id: 'primary',
      description: 'moms chase freedom',
      cardholder: 'Alexis Taylor',
      number: '4111111111114242',
      expiry: '08/27',
      cvv: '613',
      brand: 'VISA',
      variant: 'midnight' as const,
    },
    {
      id: 'travel',
      description: 'apple card',
      cardholder: 'Alexis Taylor',
      number: '5555444433331111',
      expiry: '02/26',
      cvv: '889',
      brand: 'MASTERCARD',
      variant: 'sunset' as const,
    },
    {
      id: 'business',
      description: 'sapphire',
      cardholder: 'Alexis Taylor',
      number: '379354082930004',
      expiry: '11/25',
      brand: 'AMEX',
      cvv: '889',
      variant: 'jade' as const,
    },
    {
      id: 'other',
      description: 'prime visa',
      cardholder: 'Alexis Taylor',
      number: '379354082930004',
      expiry: '11/25',
      brand: 'OTHER',
      cvv: '889',
      variant: 'jade' as const,
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <MaterialIcons size={84} color="#808080" name="credit-card" style={styles.headerIcon} />
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={styles.titleText}>
            All Cards
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            Access all your saved credit cards
          </ThemedText>
        </ThemedView>
        <View style={styles.cardStack}>
          {cards.map((card) => (
            <CreditCard key={card.id} {...card} onCopy={handleCopy} />
          ))}
        </View>
      </ScrollView>
      <Toast toastText={toastMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    marginTop: 50,
    padding: 24,
    gap: 16,
    paddingBottom: 140,
  },
  headerIcon: {
    alignSelf: 'center',
  },
  titleContainer: {
    gap: 12,
  },
  titleText: {
    fontFamily: Fonts.rounded,
  },
  subtitle: {
    color: '#808080',
  },
  cardStack: {
    width: '100%',
    gap: 8,
  },
});
