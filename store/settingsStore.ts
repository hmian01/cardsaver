import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { CARD_VARIANTS, type CardVariant } from '@/utils/cardData';
export type SettingsState = {
  defaultCardholder: string;
  defaultCardVariant: CardVariant;
  biometricLockEnabled: boolean;
  hideNumbers: boolean;
};
const defaults: SettingsState = {
  defaultCardholder: '',
  defaultCardVariant: 'jade',
  biometricLockEnabled: false,
  hideNumbers: true,
};
let snapshot = { ...defaults, loading: true, error: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const hydrate = async () => {
  try {
    const raw = await AsyncStorage.getItem('@cardsaver/settings');
    const value = raw ? JSON.parse(raw) : {};
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error('Invalid settings');
    snapshot = {
      defaultCardholder:
        typeof value.defaultCardholder === 'string'
          ? value.defaultCardholder
          : '',
      defaultCardVariant: CARD_VARIANTS.includes(
        value.defaultCardVariant as CardVariant,
      )
        ? (value.defaultCardVariant as CardVariant)
        : 'jade',
      biometricLockEnabled:
        typeof value.biometricLockEnabled === 'boolean'
          ? value.biometricLockEnabled
          : false,
      hideNumbers:
        typeof value.hideNumbers === 'boolean' ? value.hideNumbers : true,
      loading: false,
      error: false,
    };
  } catch {
    snapshot = { ...snapshot, loading: false, error: true };
  }
  emit();
};
let ready = hydrate();
let pending: Promise<unknown> = Promise.resolve();
export const settingsStore = {
  getSnapshot: () => snapshot,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  retry: () => {
    snapshot = { ...snapshot, loading: true };
    emit();
    ready = hydrate();
  },
  update: (data: Partial<SettingsState>) => {
    const task = pending.then(async () => {
      await ready;
      if (snapshot.error)
        throw new Error(
          'Settings could not be loaded. Please restart the app.',
        );
      const next = { ...snapshot, ...data };
      await AsyncStorage.setItem(
        '@cardsaver/settings',
        JSON.stringify({
          defaultCardholder: next.defaultCardholder,
          defaultCardVariant: next.defaultCardVariant,
          biometricLockEnabled: next.biometricLockEnabled,
          hideNumbers: next.hideNumbers,
        }),
      );
      snapshot = next;
      emit();
    });
    pending = task.catch(() => undefined);
    return task;
  },
  reset: () => {
    const task = pending.then(async () => {
      await ready;
      await AsyncStorage.setItem(
        '@cardsaver/settings',
        JSON.stringify(defaults),
      );
      snapshot = { ...defaults, loading: false, error: false };
      emit();
    });
    pending = task.catch(() => undefined);
    return task;
  },
};
export const useSettings = () =>
  useSyncExternalStore(
    settingsStore.subscribe,
    settingsStore.getSnapshot,
    settingsStore.getSnapshot,
  );
