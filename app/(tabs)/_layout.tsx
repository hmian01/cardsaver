import { Tabs } from 'expo-router';
import React from 'react';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialIcons color={color} size={28} name="home"  />,
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Cards',
          tabBarIcon: ({ color }) => <MaterialIcons color={color} size={28} name="credit-card"  />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <MaterialIcons color={color} size={28} name="settings"  />,
        }}
      />
      <Tabs.Screen
        name="card-editor"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
