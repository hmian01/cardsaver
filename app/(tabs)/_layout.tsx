import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticTab } from '@/components/haptic-tab';
import { Icon } from '@/components/ui';
import { theme as t } from '@/constants/theme';
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      initialRouteName="cards"
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.subtle,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: t.background,
          borderTopColor: t.border,
          elevation: 0,
          height: 64 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Wallet',
          tabBarAccessibilityLabel: 'Wallet',
          tabBarIcon: ({ color }) => (
            <Icon name="wallet" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Scan',
          tabBarAccessibilityLabel: 'Scan',
          tabBarIcon: ({ color }) => (
            <Icon name="crop-free" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarAccessibilityLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <Icon name="tune" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
