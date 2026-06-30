import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile Settings</Text>
      <Text style={styles.subtitle}>Manage your settings and update your financial parameters here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F3EA', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#8B0A2A', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
});
