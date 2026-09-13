import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme as t } from '@/constants/theme';
import { useVaultVisible } from '@/store/vaultSession';

export type IconName = keyof typeof MaterialIcons.glyphMap;
export function Icon({
  name,
  size = 22,
  color = t.text,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <MaterialIcons
      name={name}
      size={size}
      color={color}
      aria-hidden
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
export function Screen({
  children,
  scroll = true,
}: React.PropsWithChildren<{ scroll?: boolean }>) {
  return (
    <SafeAreaView style={ui.screen} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={ui.content}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}
export function IconButton({
  icon,
  label,
  onPress,
  disabled,
  active,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.iconButton,
        active && { backgroundColor: t.accent },
        (pressed || disabled) && { opacity: 0.5 },
      ]}
    >
      <Icon name={icon} color={active ? t.ink : t.text} />
    </Pressable>
  );
}
export function Button({
  title,
  onPress,
  icon,
  secondary,
  danger,
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const color = danger ? t.danger : secondary ? t.text : t.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        (secondary || danger) && ui.secondaryButton,
        (disabled || loading) && { opacity: 0.45 },
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : icon ? (
        <Icon name={icon} size={20} color={color} />
      ) : null}
      <Text style={[ui.buttonText, { color }]}>{title}</Text>
    </Pressable>
  );
}
export function Header({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <View style={ui.header}>
      <IconButton
        icon="arrow-back"
        label="Back"
        onPress={
          onBack ??
          (() =>
            router.canGoBack()
              ? router.back()
              : router.replace('/(tabs)/cards'))
        }
      />
      <View style={{ flex: 1 }}>
        <Text style={ui.headerTitle}>{title}</Text>
        {subtitle && <Text style={ui.caption}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}
export function Field({
  label,
  optional,
  error,
  ...props
}: TextInputProps & { label: string; optional?: boolean; error?: string }) {
  return (
    <View style={{ gap: 8, flex: 1 }}>
      <View style={ui.row}>
        <Text style={ui.label}>{label}</Text>
        {optional && <Text style={ui.caption}>Optional</Text>}
      </View>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={t.subtle}
        selectionColor={t.accent}
        {...props}
        style={[
          ui.input,
          props.multiline && { minHeight: 110, textAlignVertical: 'top' },
          error && { borderColor: t.danger },
          props.style,
        ]}
      />
      {error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
export function Section({
  title,
  trailing,
  children,
}: React.PropsWithChildren<{ title: string; trailing?: React.ReactNode }>) {
  return (
    <View style={{ gap: 14 }}>
      <View style={ui.rowBetween}>
        <Text style={ui.sectionTitle}>{title}</Text>
        {trailing}
      </View>
      {children}
    </View>
  );
}
export function Notice({
  children,
  error = false,
}: React.PropsWithChildren<{ error?: boolean }>) {
  return (
    <View
      accessibilityRole={error ? 'alert' : undefined}
      style={[ui.notice, error && { borderColor: '#71493E' }]}
    >
      <Icon
        name={error ? 'error-outline' : 'info-outline'}
        color={error ? t.danger : t.muted}
        size={19}
      />
      <Text style={[ui.body, { flex: 1, color: error ? t.danger : t.muted }]}>
        {children}
      </Text>
    </View>
  );
}
export function EmptyState({
  icon = 'credit-card',
  title,
  description,
  children,
}: React.PropsWithChildren<{
  icon?: IconName;
  title: string;
  description: string;
}>) {
  return (
    <View style={ui.empty}>
      <View style={ui.emptyIcon}>
        <Icon name={icon} size={34} color={t.accent} />
      </View>
      <Text style={ui.emptyTitle}>{title}</Text>
      <Text style={[ui.body, { textAlign: 'center', maxWidth: 280 }]}>
        {description}
      </Text>
      {children}
    </View>
  );
}
export function Dialog({
  visible,
  title,
  description,
  onClose,
  onDismiss,
  avoidKeyboard = false,
  contentStyle,
  children,
}: React.PropsWithChildren<{
  visible: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onDismiss?: () => void;
  avoidKeyboard?: boolean;
  contentStyle?: ViewStyle;
}>) {
  const vaultVisible = useVaultVisible();
  return (
    <Modal
      visible={visible && vaultVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      <KeyboardAvoidingView
        enabled={avoidKeyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={ui.scrim}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close dialog"
          onPress={onClose}
        />
        <View accessibilityViewIsModal style={[ui.dialog, contentStyle]}>
          <View style={ui.rowBetween}>
            <Text style={[ui.sectionTitle, { flex: 1 }]}>{title}</Text>
            <IconButton icon="close" label="Close dialog" onPress={onClose} />
          </View>
          {description && <Text style={ui.body}>{description}</Text>}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.background },
  content: {
    padding: 24,
    gap: 26,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    flexGrow: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: '600',
    color: t.text,
    letterSpacing: -0.6,
  },
  title: {
    fontSize: 38,
    fontWeight: '600',
    letterSpacing: -1.6,
    color: t.text,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: t.muted,
  },
  sectionTitle: {
    color: t.text,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  body: { color: t.muted, fontSize: 14, lineHeight: 21 },
  caption: { color: t.muted, fontSize: 12, lineHeight: 18 },
  label: { color: t.text, fontSize: 13, fontWeight: '500' },
  panel: {
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 22,
    padding: 20,
    gap: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: t.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: t.accent,
    minHeight: 52,
    paddingHorizontal: 19,
    paddingVertical: 14,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  secondaryButton: {
    backgroundColor: t.raised,
    borderWidth: 1,
    borderColor: t.border,
  },
  buttonText: { fontSize: 14, fontWeight: '700' },
  input: {
    backgroundColor: t.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: t.border,
    color: t.text,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  error: { color: t.danger, fontSize: 12, lineHeight: 18 },
  notice: {
    padding: 15,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 17,
  },
  empty: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 42,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    width: 78,
    height: 78,
    borderRadius: 26,
    backgroundColor: t.raised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    color: t.text,
    fontSize: 25,
    fontWeight: '500',
    letterSpacing: -0.7,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: t.surface,
    borderRadius: 26,
    padding: 22,
    gap: 18,
    borderColor: t.border,
    borderWidth: 1,
  },
});
