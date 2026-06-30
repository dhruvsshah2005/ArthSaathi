// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { initLocalDB } from '../lib/database';

export default function RootLayout() {
  useEffect(() => {
    initLocalDB()
      .then(() => console.log('SQLite database initialized successfully'))
      .catch((error) => console.error('Failed to initialize SQLite database:', error));
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}