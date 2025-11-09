import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import CreditCard from '@/components/creditcard';
import Toast from '@/components/toast';
import { Fonts } from '@/constants/theme';
import { cardsStore, type StoredCard } from '@/store/cardsStore';

export default function CardsScreen() {
  const [toastMessage, setToastMessage] = useState('');
  const [cards, setCards] = useState<StoredCard[]>(() => cardsStore.getCards());
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
    const unsubscribe = cardsStore.subscribe(setCards);
    return () => {
      unsubscribe();
      if (pendingReset.current) {
        clearTimeout(pendingReset.current);
      }
    };
  }, []);

  const handleCopy = () => {
    triggerToast(`Copied To Clipboard`);
  };

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
          {cards.reverse().map((card) => (
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
