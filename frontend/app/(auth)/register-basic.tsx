import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function RegisterBasicScreen() {
  const router = useRouter();
  const { language } = useLocalSearchParams(); // Retrieve language from previous screen

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleNext = () => {
    if (!name || !phone || !password) {
      Alert.alert('Missing Details', 'Please complete all fields.');
      return;
    }
    // Pass ALL collected data to the final profile screen
    router.push({
      pathname: '/register-basic',
      params: { language, name, phone, password },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>Create Account</Text>
      
      <Text style={styles.sectionLabel}>Full Name</Text>
      <TextInput style={styles.input} placeholder="Enter Full Name" value={name} onChangeText={setName} />

      <Text style={styles.sectionLabel}>Phone Number</Text>
      <TextInput style={styles.input} placeholder="Enter Phone Number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

      <Text style={styles.sectionLabel}>Password</Text>
      <TextInput style={styles.input} placeholder="Create Password" secureTextEntry value={password} onChangeText={setPassword} />

      <Pressable style={styles.centeredSubmitButton} onPress={handleNext}>
        <Text style={styles.buttonText}>CREATE PROFILE</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F6F3EA', padding: 24, justifyContent: 'center' },
  headerTitle: { fontSize: 32, fontWeight: '700', color: '#8B0A2A', textAlign: 'center', marginBottom: 24 },
  sectionLabel: { fontSize: 18, fontWeight: '600', marginVertical: 12, color: '#8B0A2A' },
  input: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E7D7DA' },
  centeredSubmitButton: { marginTop: 30, backgroundColor: '#8B0A2A', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '700', fontSize: 18 },
});