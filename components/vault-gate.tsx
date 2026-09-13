import * as LocalAuthentication from 'expo-local-authentication';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { settingsStore, useSettings } from '@/store/settingsStore';
import { theme as t } from '@/constants/theme';
import { VaultContext } from '@/store/vaultSession';
import { Button, Icon, ui } from './ui';

export { useVaultVisible } from '@/store/vaultSession';
let lastVerifiedAt = 0;
export async function authenticate(): Promise<boolean> {
  if (Platform.OS === 'web')
    throw new Error('Biometric lock is available in the iOS and Android apps.');
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  if (level === LocalAuthentication.SecurityLevel.NONE)
    throw new Error(
      'Set up a fingerprint, face unlock, or device passcode in your device settings first.',
    );
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock CardSaver',
    cancelLabel: 'Cancel',
    fallbackLabel: 'Use passcode',
  });
  if (result.success) {
    lastVerifiedAt = Date.now();
    return true;
  }
  if (['user_cancel', 'system_cancel', 'app_cancel'].includes(result.error))
    return false;
  throw new Error(
    'Unable to verify your identity. Please try again or use your device passcode.',
  );
}

export function VaultGate({ children }: React.PropsWithChildren) {
  const settings = useSettings();
  const [unlocked, setUnlocked] = useState(false);
  const [obscured, setObscured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const authInFlight = useRef(false);
  const automaticAttempted = useRef(false);
  const awayAt = useRef<number | null>(null);
  const previousEnabled = useRef(settings.biometricLockEnabled);
  const unlock = useCallback(async () => {
    if (authInFlight.current) return;
    authInFlight.current = true;
    setBusy(true);
    setError('');
    try {
      if (await authenticate()) setUnlocked(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to unlock. Please try again.',
      );
    } finally {
      authInFlight.current = false;
      setBusy(false);
      setObscured(false);
      awayAt.current = null;
    }
  }, []);
  const locked = settings.biometricLockEnabled && !unlocked;
  useEffect(() => {
    if (settings.biometricLockEnabled !== previousEnabled.current)
      setUnlocked(Date.now() - lastVerifiedAt < 15_000);
    previousEnabled.current = settings.biometricLockEnabled;
  }, [settings.biometricLockEnabled]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (authInFlight.current) return;
      if (state !== 'active') {
        awayAt.current ??= Date.now();
        setObscured(true);
      } else {
        if (awayAt.current && Date.now() - awayAt.current >= 60_000)
          setUnlocked(false);
        awayAt.current = null;
        setObscured(false);
      }
    });
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!locked) {
      automaticAttempted.current = false;
      return;
    }
    if (
      settings.loading ||
      settings.error ||
      obscured ||
      automaticAttempted.current
    )
      return;
    automaticAttempted.current = true;
    void unlock();
  }, [locked, obscured, settings.error, settings.loading, unlock]);
  const blocked = settings.loading || settings.error || locked || obscured;
  return (
    <View style={{ flex: 1 }}>
      {!settings.loading && !settings.error && (
        <VaultContext.Provider value={!blocked}>
          <View
            style={{ flex: 1 }}
            pointerEvents={blocked ? 'none' : 'auto'}
            accessibilityElementsHidden={blocked}
            importantForAccessibility={blocked ? 'no-hide-descendants' : 'auto'}
          >
            {children}
          </View>
        </VaultContext.Provider>
      )}
      {obscured && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: t.background,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Icon name="wallet" size={40} color={t.accent} />
        </View>
      )}
      <Modal
        visible={settings.loading || settings.error || locked}
        animationType="none"
        onRequestClose={() => {}}
        statusBarTranslucent
      >
        <View style={styles.lock}>
          <View style={styles.mark}>
            <Icon name="wallet" color={t.ink} size={38} />
          </View>
          <Text style={ui.eyebrow}>CARDSAVER</Text>
          {settings.loading ? (
            <ActivityIndicator color={t.accent} />
          ) : obscured && !locked ? null : (
            <>
              <Text style={styles.title}>
                {settings.error
                  ? 'Settings unavailable'
                  : 'Your wallet awaits.'}
              </Text>
              <Text style={[ui.body, { textAlign: 'center' }]}>
                {settings.error
                  ? 'We couldn’t load your lock settings. Retry to continue.'
                  : 'Unlock to access your cards.'}
              </Text>
              {error ? (
                <Text style={[ui.error, { textAlign: 'center' }]}>{error}</Text>
              ) : null}
              <Button
                title={settings.error ? 'Try again' : 'Unlock wallet'}
                icon="lock-open"
                loading={busy}
                onPress={settings.error ? settingsStore.retry : unlock}
              />
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  lock: {
    flex: 1,
    backgroundColor: t.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    gap: 22,
  },
  mark: {
    backgroundColor: t.accent,
    width: 86,
    height: 86,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: t.text, fontSize: 30, fontWeight: '500', letterSpacing: -1 },
});
