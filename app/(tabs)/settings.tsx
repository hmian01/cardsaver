import { useFeedback } from '@/components/feedback';
import {
  Button,
  Dialog,
  Field,
  Icon,
  Notice,
  Screen,
  Section,
  ui,
} from '@/components/ui';
import { authenticate } from '@/components/vault-gate';
import { theme as t } from '@/constants/theme';
import { cardsStore } from '@/store/cardsStore';
import {
  settingsStore,
  useSettings,
  type SettingsState,
} from '@/store/settingsStore';
import { clearCardImages } from '@/utils/cardImages';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useSettings();
  const notify = useFeedback();
  const [name, setName] = useState(settings.defaultCardholder);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resetVisible, setResetVisible] = useState(false);
  useEffect(
    () => setName(settings.defaultCardholder),
    [settings.defaultCardholder],
  );
  const update = async (data: Partial<SettingsState>, verify = false) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (verify && !(await authenticate())) return;
      await settingsStore.update(data);
      notify('Settings saved');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not save settings. Try again.',
      );
    } finally {
      setBusy(false);
    }
  };
  const resetApp = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await Promise.all([cardsStore.clear(), settingsStore.reset()]);
      await clearCardImages();
      setResetVisible(false);
      notify('CardSaver has been reset');
      router.replace('/(tabs)');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not reset CardSaver. Try again.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <Text style={ui.eyebrow}>MAKE IT YOURS</Text>
        <Text style={ui.title}>Settings.</Text>
        <Text style={ui.body}>A wallet that works your way.</Text>
      </View>
      {error ? <Notice error>{error}</Notice> : null}
      <Section title="Privacy">
        <View style={ui.panel}>
          <SettingToggle
            icon="fingerprint"
            title="Biometric lock"
            description={
              Platform.OS === 'web'
                ? 'Available in the iOS and Android apps.'
                : 'Protect the whole app. Locks after a minute away.'
            }
            value={settings.biometricLockEnabled}
            disabled={busy || Platform.OS === 'web'}
            onChange={(value) => {
              void update({ biometricLockEnabled: value }, true);
            }}
          />
          <View style={styles.divider} />
          <SettingToggle
            icon="visibility-off"
            title="Hide card numbers"
            description="Show only the last four digits in your wallet."
            value={settings.hideNumbers}
            disabled={busy}
            onChange={(value) => {
              void update({ hideNumbers: value });
            }}
          />
        </View>
      </Section>
      <Section title="Make adding cards easier">
        <View style={ui.panel}>
          <Field
            label="Default cardholder"
            optional
            placeholder="Your name"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
            maxLength={100}
            editable={!busy}
          />
          <Button
            title="Save name"
            secondary
            disabled={busy || name.trim() === settings.defaultCardholder}
            onPress={() => {
              void update({ defaultCardholder: name.trim() });
            }}
          />
        </View>
      </Section>
      <Section title="Your data">
        <View style={[ui.panel, { paddingVertical: 4, gap: 0 }]}>
          <SettingsLink
            icon="file-download"
            title="Import cards"
            description="Restore a CardSaver backup"
            onPress={() => router.push('/(tabs)/cards/transfer?mode=import')}
          />
          <View style={styles.divider} />
          <SettingsLink
            icon="ios-share"
            title="Export cards"
            description="Choose cards and create a backup"
            onPress={() => router.push('/(tabs)/cards/transfer?mode=export')}
          />
        </View>
        <Text style={ui.caption}>
          Cards and photos stay on this device unless you export them. CardSaver
          does not provide cloud sync or encrypt stored data. Keep your device
          and backup files protected.
        </Text>
      </Section>
      <Section title="Reset CardSaver">
        <View style={ui.panel}>
          <Text style={ui.body}>
            Permanently remove every card, photo, note, and preference from this
            device.
          </Text>
          <Button
            title="Reset all app data"
            icon="delete-forever"
            danger
            disabled={busy}
            onPress={() => {
              setError('');
              setResetVisible(true);
            }}
          />
        </View>
      </Section>
      <View style={styles.footer}>
        <Icon name="wallet" size={24} color={t.subtle} />
        <Text style={ui.caption}>CardSaver · A place for every card.</Text>
      </View>
      <Dialog
        visible={resetVisible}
        title="Reset CardSaver?"
        description="This cannot be undone. Every card, photo, note, and setting on this device will be permanently removed. Export a backup first if you may need this data again."
        onClose={() => {
          if (busy) return;
          setResetVisible(false);
        }}
      >
        {error ? <Notice error>{error}</Notice> : null}
        <Button
          title="Permanently reset CardSaver"
          icon="delete-forever"
          danger
          loading={busy}
          onPress={() => {
            void resetApp();
          }}
        />
      </Dialog>
    </Screen>
  );
}
function SettingToggle({
  icon,
  title,
  description,
  value,
  disabled,
  onChange,
}: {
  icon: 'fingerprint' | 'visibility-off';
  title: string;
  description: string;
  value: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={ui.rowBetween}>
      <Icon name={icon} color={t.accent} />
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={ui.label}>{title}</Text>
        <Text style={ui.caption}>{description}</Text>
      </View>
      <Switch
        {...(Platform.OS === 'web' ? { activeThumbColor: t.accent } : {})}
        accessibilityLabel={title}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: t.border, true: '#7E9B55' }}
        thumbColor={value ? t.accent : t.muted}
      />
    </View>
  );
}
function SettingsLink({
  icon,
  title,
  description,
  onPress,
}: {
  icon: 'file-download' | 'ios-share';
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.link}>
      <Icon name={icon} color={t.accent} />
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={ui.label}>{title}</Text>
        <Text style={ui.caption}>{description}</Text>
      </View>
      <Icon name="chevron-right" color={t.subtle} />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: t.border },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 20,
  },
  footer: { alignItems: 'center', gap: 12, paddingVertical: 10 },
});
