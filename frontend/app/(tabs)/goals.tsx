import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function GoalsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Financial Goals</Text>
      <Text style={styles.subtitle}>Track your savings plans and long term targets here!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F3EA', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#8B0A2A', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
});
