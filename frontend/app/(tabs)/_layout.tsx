import { Tabs } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as SecureStore from 'expo-secure-store';
import { openDB } from '../../lib/database';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const [isBlind, setIsBlind] = useState(false);

  useEffect(() => {
    async function checkBlindStatus() {
      try {
        const activeUserId = await SecureStore.getItemAsync('active_user_id');
        if (!activeUserId) return;
        const db = await openDB();
        const rows = await db.getAllAsync<{ is_blind: number }>(
          'SELECT is_blind FROM parametric_profiles WHERE user_id = ? LIMIT 1',
          [activeUserId]
        );
        if (rows && rows.length > 0) {
          setIsBlind(rows[0].is_blind === 1);
        }
      } catch (e) {
        console.log('Failed to query blind status in tabs layout:', e);
      }
    }
    checkBlindStatus();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: [
          Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute' as 'absolute',
            },
            default: {},
          }),
          isBlind ? { display: 'none' } : {}, // HIDE bottom navbar for visually impaired (Single Tab App)
        ],
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chevron.right" color={color} />,
        }}
      />
      <Tabs.Screen
        name="learning"
        options={{
          title: 'Learning',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chevron.left.forwardslash.chevron.right" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chevron.right" color={color} />,
        }}
      />
    </Tabs>
  );
}
