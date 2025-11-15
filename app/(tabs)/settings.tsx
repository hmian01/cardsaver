import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { settingsStore } from '@/store/settingsStore';

export default function SettingsScreen() {
  const [settings, setSettings] = useState(() => settingsStore.getSettings());
  const [defaultNameInput, setDefaultNameInput] = useState(settings.defaultCardholder);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(settings.biometricLockEnabled);

  useEffect(() => {
    const unsubscribe = settingsStore.subscribe((next) => {
      setSettings(next);
      setDefaultNameInput(next.defaultCardholder);
      setBiometricEnabled(next.biometricLockEnabled);
    });
    return unsubscribe;
  }, []);

  const trimmedInput = defaultNameInput.trim();
  const saveDisabled = useMemo(() => {
    return trimmedInput === settings.defaultCardholder.trim();
  }, [settings.defaultCardholder, trimmedInput]);

  useEffect(() => {
    if (!lastSavedAt) return;
    const timeout = setTimeout(() => setLastSavedAt(null), 2000);
    return () => clearTimeout(timeout);
  }, [lastSavedAt]);

  const handleSaveDefault = async () => {
    if (saveDisabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    settingsStore.setDefaultCardholder(trimmedInput);
    setLastSavedAt(Date.now());
  };

  const ensureBiometricAuth = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      Alert.alert('Face ID', 'This device does not support Face ID.');
      return false;
    }
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      Alert.alert('Face ID', 'Set up Face ID on this device before using this lock.');
      return false;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm Face ID',
      fallbackLabel: 'Enter Passcode',
      cancelLabel: 'Cancel',
    });
    if (!result.success) {
      if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
        Alert.alert('Face ID', 'Unable to verify your identity. Please try again.');
      }
      return false;
    }
    return true;
  };

  const handleToggleBiometrics = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const verified = await ensureBiometricAuth();
    if (!verified) {
      return;
    }
    setBiometricEnabled(value);
    settingsStore.setBiometricLockEnabled(value);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>CardSaver Settings</Text>
          </View>
          <View style={styles.heroIcon}>
            <MaterialIcons name="settings" size={34} color="#050710" />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Vault Access</Text>
          </View>
          <Text style={styles.sectionTitle}>Face ID lock</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>
                {biometricEnabled ? 'Enabled' : 'Disabled'}
              </Text>
              <Text style={styles.toggleSubtitle}>
                Protect the cards tab with Face ID when this is on.
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometrics}
              thumbColor={biometricEnabled ? '#A5F276' : '#727682'}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(165,242,118,0.4)' }}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Personalization</Text>
            {lastSavedAt && <Text style={styles.sectionStatus}>Saved</Text>}
          </View>
          <Text style={styles.sectionTitle}>Default cardholder name</Text>
          <TextInput
            value={defaultNameInput}
            onChangeText={setDefaultNameInput}
            placeholder="Alexis Taylor"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.input}
            autoCapitalize="words"
          />
          <TouchableOpacity
            style={[styles.primaryButton, saveDisabled && styles.primaryButtonDisabled]}
            disabled={saveDisabled}
            onPress={handleSaveDefault}
          >
            <Text style={styles.primaryButtonText}>
              {saveDisabled ? 'Up to date' : 'Save default name'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Security</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <MaterialIcons name="lock" size={18} color="#9EE0FF" />
            </View>
            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>Face ID protected</Text>
              <Text style={styles.infoSubtitle}>
                The vault stays hidden until you authenticate, ensuring on-device data stays yours.
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <MaterialIcons name="shield" size={18} color="#A5F276" />
            </View>
            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>Offline storage</Text>
              <Text style={styles.infoSubtitle}>
                Cards are encrypted and saved directly on your device. Nothing leaves your phone.
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <MaterialIcons name="history" size={18} color="#FFD479" />
            </View>
            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>Privacy-first camera</Text>
              <Text style={styles.infoSubtitle}>
                The scanner only captures the digits to autofill — no images or media are stored.
              </Text>
            </View>
          </View>
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
    paddingBottom: 140,
    gap: 24,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F1324',
    borderRadius: 28,
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  heroTextBlock: {
    flex: 1,
    gap: 6,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.6,
    fontSize: 13,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontFamily: Fonts.rounded,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#9EE0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  sectionCard: {
    backgroundColor: '#0B0F1E',
    borderRadius: 24,
    padding: 20,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  sectionStatus: {
    color: '#A5F276',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: Fonts.rounded,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  toggleText: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
  },
  input: {
    backgroundColor: '#080C1B',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.29)',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#A5F276',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: 'rgba(165,242,118,0.3)',
  },
  primaryButtonText: {
    color: '#050710',
    fontWeight: '600',
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  infoCopy: {
    flex: 1,
    gap: 2,
  },
  infoTitle: {
    color: '#fff',
    fontWeight: '600',
  },
  infoSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
});
