import { Stack } from 'expo-router';

export default function CardsStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      <Stack.Screen
        name="card-editor"
        options={{ gestureEnabled: true, animation: 'slide_from_right' }}
      />
    </Stack>
  );
}
