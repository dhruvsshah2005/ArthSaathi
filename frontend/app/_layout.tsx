// app/_layout.tsx
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { initLocalDB } from '../lib/database';
import { Text, View } from 'react-native';
import 'react-native-get-random-values'; // Required for uuid to work securely in React Native

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const setupDB = async () => {
      try {
        await initLocalDB();
        setDbReady(true);
      } catch (error) {
        console.error("Database initialization failed:", error);
      }
    };
    setupDB();
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Booting ArthaSaathi Local Engine...</Text>
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