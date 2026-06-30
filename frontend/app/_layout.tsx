// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { initLocalDB } from '../lib/database';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initLocalDB()
      .then(() => {
        console.log('SQLite database initialized successfully');
        setDbReady(true);
      })
      .catch((error) => {
        console.error('Failed to initialize SQLite database:', error);
        setDbReady(true); // Fallback to avoid sticking the app on splash
      });
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F3EA' }}>
        <ActivityIndicator size="large" color="#8B0A2A" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}