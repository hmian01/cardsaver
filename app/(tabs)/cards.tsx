import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Fonts } from '@/constants/theme';

export default function SettingsScreen() {

  return (
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


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    padding: 24,
    gap: 16,
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
});
