import AsyncStorage from '@react-native-async-storage/async-storage';

export type SettingsState = {
  defaultCardholder: string;
  biometricLockEnabled: boolean;
};

type SettingsListener = (settings: SettingsState) => void;

const STORAGE_KEY = '@cardsaver/settings';
const DEFAULT_SETTINGS: SettingsState = {
  defaultCardholder: '',
  biometricLockEnabled: true,
};

let settings: SettingsState = { ...DEFAULT_SETTINGS };
const listeners = new Set<SettingsListener>();
let hasHydratedSettings = false;
let localMutationDuringHydration = false;

const notify = () => {
  const snapshot = { ...settings };
  listeners.forEach((listener) => listener(snapshot));
};

const setSettings = (nextSettings: SettingsState) => {
  settings = nextSettings;
  notify();
};

const persistSettings = (nextSettings: SettingsState) => {
  setSettings(nextSettings);
  const payload = JSON.stringify(nextSettings);
  AsyncStorage.setItem(STORAGE_KEY, payload).catch((error) => {
    console.error('Failed to persist settings', error);
  });
  if (!hasHydratedSettings) {
    localMutationDuringHydration = true;
  }
};

const hydrateSettings = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      if (localMutationDuringHydration) {
        return;
      }
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        setSettings({
          defaultCardholder:
            typeof parsed.defaultCardholder === 'string' ? parsed.defaultCardholder : '',
          biometricLockEnabled:
            typeof parsed.biometricLockEnabled === 'boolean'
              ? parsed.biometricLockEnabled
              : DEFAULT_SETTINGS.biometricLockEnabled,
        });
        return;
      }
      console.warn('Stored settings invalid. Resetting to defaults.');
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to hydrate settings store', error);
  } finally {
    hasHydratedSettings = true;
  }
};

export const settingsStore = {
  getSettings: () => ({ ...settings }),
  subscribe: (listener: SettingsListener) => {
    listeners.add(listener);
    listener({ ...settings });
    return () => listeners.delete(listener);
  },
  setDefaultCardholder: (value: string) => {
    persistSettings({
      ...settings,
      defaultCardholder: value.trim(),
    });
  },
  setBiometricLockEnabled: (enabled: boolean) => {
    persistSettings({
      ...settings,
      biometricLockEnabled: enabled,
    });
  },
};

void hydrateSettings();
