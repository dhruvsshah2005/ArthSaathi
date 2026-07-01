import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { openDB } from '../../lib/database';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();

    if (!cleanPhone || !cleanPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      // 1. Send authentication request to the backend
      const response = await fetch('https://violation-coastline-otter.ngrok-free.dev/api/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          phone_number: cleanPhone,
          password: cleanPassword,
        }),
      });

      const contentType = response.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Request failed with status ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed on server');
      }

      // 2. Ensure profile exists before proceeding
      if (!data.profile) {
        throw new Error('No profile found for this user on the server. Please register a complete profile.');
      }

      const p = data.profile;
      console.log('Inserting profile data safely to avoid SQLite crash:', p);

      // Safe Primitive Type Casting to prevent Android JSI NullPointerException
      const profileId = typeof p.profile_id === 'string' ? p.profile_id : '';
      const userId = typeof p.user_id === 'string' ? p.user_id : (typeof data.user_id === 'string' ? data.user_id : '');
      const name = typeof p.name === 'string' ? p.name : '';
      const lang = typeof p.language_code === 'string' ? p.language_code : '';
      const occ = typeof p.occupation_type === 'string' ? p.occupation_type : '';
      const edu = typeof p.education_level === 'string' ? p.education_level : '';
      const incType = typeof p.income_type === 'string' ? p.income_type : '';
      const incVal = typeof p.income_value === 'string' ? p.income_value : '';
      const bal = typeof p.current_balance === 'number' ? p.current_balance : 0;
      const crop = typeof p.crop_type === 'string' ? p.crop_type : '';
      const land = typeof p.land_holding === 'string' ? p.land_holding : '';
      const incPat = typeof p.income_pattern === 'string' ? p.income_pattern : '';
      const isBlind = p.is_blind ? 1 : 0; // Boolean strictly cast to Int
      const trust = typeof p.trust_score === 'number' ? p.trust_score : 75;

      const mainUserId = typeof data.user_id === 'string' ? data.user_id : '';
      const safePhone = typeof cleanPhone === 'string' ? cleanPhone : '';

      // 3. Save User and Profile locally to SQLite for offline access
      const db = await openDB();
      
      // Save User locally
      await db.runAsync(
        `INSERT OR REPLACE INTO users (user_id, phone_number, password_hash) VALUES (?, ?, ?)`,
        mainUserId, safePhone, '' // Hashed password is kept secure on backend, empty locally
      );

      // Save Profile locally
      await db.runAsync(
        `INSERT OR REPLACE INTO parametric_profiles (
          profile_id, user_id, name, language_code, occupation_type,
          education_level, income_type, income_value, current_balance,
          crop_type, land_holding, income_pattern,
          is_blind, trust_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        profileId, userId, name, lang, occ, edu, incType, incVal,
        bal, crop, land, incPat, isBlind, trust
      );

      // 4. Store active credentials securely
      await SecureStore.setItemAsync('auth_token', String(data.access_token));
      await SecureStore.setItemAsync('active_user_id', String(data.user_id));

      router.replace('/(tabs)');
    } catch (error: any) {
      console.log('Login error details:', error);
      Alert.alert('Login Failed', error.message || 'Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>₹</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to access your ArthSaathi account</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your registered phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          {loading ? (
            <ActivityIndicator size="large" color="#8B0A2A" style={{ marginVertical: 20 }} />
          ) : (
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>Log In</Text>
            </Pressable>
          )}

          <Pressable onPress={() => router.replace('/register-lang')} style={styles.backBtn}>
            <Text style={styles.backText}>{"Don't have an account? Sign Up"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F3EA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    color: '#8B0A2A',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#8B0A2A',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#8B0A2A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#8B0A2A',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  backBtn: {
    alignItems: 'center',
    marginTop: 20,
  },
  backText: {
    color: '#8B0A2A',
    fontSize: 14,
    fontWeight: '600',
  },
});
