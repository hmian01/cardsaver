import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { FeedbackProvider } from '@/components/feedback';
import { VaultGate } from '@/components/vault-gate';
import { theme } from '@/constants/theme';

export const unstable_settings = { anchor: '(tabs)' };
export default function RootLayout() {
  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ThemeProvider
        value={{
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: theme.background,
            card: theme.surface,
            primary: theme.accent,
            text: theme.text,
            border: theme.border,
          },
        }}
      >
        <VaultGate>
          <FeedbackProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.background },
              }}
            >
              <Stack.Screen name="(tabs)" />
            </Stack>
          </FeedbackProvider>
        </VaultGate>
        <StatusBar style="light" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
