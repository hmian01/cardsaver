import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Fonts } from '@/constants/theme';

export default function SettingsScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [autoUpdates, setAutoUpdates] = useState(false);
  const [biometrics, setBiometrics] = useState(true);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <MaterialIcons size={84} color="#808080" name="settings" style={styles.headerIcon} />
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.titleText}>
          Settings
        </ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          Manage preferences, privacy, and support options for your account.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Preferences</ThemedText>
        <View style={styles.row}>
          <ThemedText>Push notifications</ThemedText>
          <Switch value={pushNotifications} onValueChange={setPushNotifications} />
        </View>
        <View style={styles.row}>
          <ThemedText>Auto updates</ThemedText>
          <Switch value={autoUpdates} onValueChange={setAutoUpdates} />
        </View>
        <View style={styles.row}>
          <ThemedText>Use biometrics</ThemedText>
          <Switch value={biometrics} onValueChange={setBiometrics} />
        </View>
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
  section: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
