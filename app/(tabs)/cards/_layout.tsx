import { Stack } from 'expo-router';
import { theme } from '@/constants/theme';
export default function CardsStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="card-editor" options={{ gestureEnabled: false }} />
      <Stack.Screen name="card-details" />
      <Stack.Screen name="transfer" />
      <Stack.Screen name="reorder" />
    </Stack>
  );
}
