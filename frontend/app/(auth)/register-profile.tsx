import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto'; // Replaces uuid to prevent Expo Go crashes

// Import your local SQLite database utility
import { openDB } from '../../lib/database';

const OCCUPATIONS = [
  { id: 'teacher', label: '🎓 Teacher' }, 
  { id: 'gig_worker', label: '🛵 Gig Worker' },
  { id: 'farmer', label: '🚜 Farmer' }, 
  { id: 'student', label: '📚 Student' },
  { id: 'homemaker', label: '🏠 Homemaker' }, 
  { id: 'other', label: '💼 Other' },
];

const EDUCATION_LEVELS = [
  { id: 'under_5th', label: 'Below 5th Pass' }, 
  { id: '5th_pass', label: '5th Pass' },
  { id: '10th_pass', label: '10th Pass' }, 
  { id: '12th_pass_above', label: '12th Pass & Above' },
];

const INCOME_RANGES = ['₹0 - ₹15,000', '₹15,001 - ₹30,000', '₹30,001 - ₹60,000', '₹60,000+'];
const LAND_HOLDINGS = ['< 1 acre', '1 - 3 acres', '3 - 10 acres', '10+ acres'];
const INCOME_PATTERNS = ['Seasonal', 'Harvest Based', 'Mixed'];

export default function RegisterProfileScreen() {
  const router = useRouter();
  
  // Retrieve data passed down from register-lang and register-basic
  const { language, name, phone, password } = useLocalSearchParams();

  const [selectedOccupation, setSelectedOccupation] = useState('');
  const [selectedEducation, setSelectedEducation] = useState('');
  const [incomeType, setIncomeType] = useState<'fixed' | 'variable'>('fixed');
  const [salary, setSalary] = useState('');
  const [variableRange, setVariableRange] = useState(INCOME_RANGES[0]);
  const [currentBalance, setCurrentBalance] = useState('');
  
  // Farmer specific states
  const [cropType, setCropType] = useState('');
  const [landHolding, setLandHolding] = useState('');
  const [incomePattern, setIncomePattern] = useState('');

  const submitRegistration = async () => {
    const safePhone = Array.isArray(phone) ? phone[0] : (phone || "");
    const safePassword = Array.isArray(password) ? password[0] : (password || "");
    const safeName = Array.isArray(name) ? name[0] : (name || "");
    const safeLanguage = Array.isArray(language) ? language[0] : (language || "");
    if (!selectedOccupation || !selectedEducation || !currentBalance) {
      Alert.alert('Incomplete Profile', 'Please fill all fields');
      return;
    }

    if (selectedOccupation === 'farmer' && (!cropType || !landHolding || !incomePattern)) {
      Alert.alert('Farmer Details Missing', 'Please complete the crop and land details.');
      return;
    }

    try {
      // 1. Generate Offline UUIDs securely
      const localUserId = Crypto.randomUUID();
      const localProfileId = Crypto.randomUUID();

      // 2. Prepare payload exactly matching the FastAPI backend schema
      const payload: any = {
        local_user_id: localUserId,
        local_profile_id: localProfileId,
        phone_number: safePhone,
        password: safePassword, // Pass the plaintext password to the backend
        name: safeName,
        language_code: safeLanguage,
        occupation_type: selectedOccupation,
        education_level: selectedEducation,
        income_type: incomeType,
        income_value: incomeType === 'fixed' ? salary : variableRange,
        current_balance: parseFloat(currentBalance) || 0,
      };

      if (selectedOccupation === 'farmer') {
        payload.crop_type = cropType;
        payload.land_holding = landHolding;
        payload.income_pattern = incomePattern;
      }

      // 3. Send payload to FastAPI using your Ngrok URL
      const response = await fetch('https://graceless-freefall-nimbly.ngrok-free.dev/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        throw new Error(
          typeof data.detail === 'object'
            ? JSON.stringify(data.detail)
            : data.detail || 'Registration failed on server'
        );
      }

      // 4. If backend succeeds, save to local SQLite for offline access
      const db = await openDB();
      await db.runAsync(
        `INSERT INTO users (user_id, phone_number, password_hash) VALUES (?, ?, ?)`,
        [localUserId, safePhone, safePassword] // Using the casted strings
      );

      await db.runAsync(
        `INSERT INTO parametric_profiles (
          profile_id, user_id, name, language_code, occupation_type, 
          education_level, income_type, income_value, current_balance, 
          crop_type, land_holding, income_pattern
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          localProfileId, 
          localUserId, 
          safeName, 
          safeLanguage, 
          selectedOccupation, 
          selectedEducation, 
          incomeType, 
          incomeType === 'fixed' ? salary : variableRange, 
          parseFloat(currentBalance) || 0,
          cropType || null, 
          landHolding || null, 
          incomePattern || null
        ]
      );

      // 5. Store the JWT securely
      await SecureStore.setItemAsync('auth_token', data.access_token);

      Alert.alert('Success', 'Account created and synced!', [
        { text: 'Go to Dashboard', onPress: () => router.replace('/(tabs)') }
      ]);

    }catch (error: any) {
      console.log("--- ERROR LOG START ---");
      console.log(error); // This will show you exactly which line failed
      console.log("--- ERROR LOG END ---");
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>Financial Persona</Text>
      
      <Text style={styles.sectionLabel}>Occupation</Text>
      <View style={styles.grid3x2}>
        {OCCUPATIONS.map((occ) => (
          <Pressable 
            key={occ.id} 
            style={[styles.gridBox, selectedOccupation === occ.id && styles.activeGridBox]} 
            onPress={() => setSelectedOccupation(occ.id)}
          >
            <Text style={{ textAlign: 'center' }}>{occ.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Education</Text>
      <View style={{ gap: 10 }}>
        {EDUCATION_LEVELS.map((edu) => (
          <Pressable 
            key={edu.id} 
            style={[styles.textChip, selectedEducation === edu.id && styles.activeChip]} 
            onPress={() => setSelectedEducation(edu.id)}
          >
            <Text>{edu.label}</Text>
          </Pressable>
        ))}
      </View>

      {selectedOccupation !== 'farmer' ? (
        <>
          <Text style={styles.sectionLabel}>Income</Text>
          <View style={styles.toggleContainer}>
            <Pressable 
              style={[styles.toggleBtn, incomeType === 'fixed' && styles.activeToggle]} 
              onPress={() => setIncomeType('fixed')}
            >
              <Text>Fixed</Text>
            </Pressable>
            <Pressable 
              style={[styles.toggleBtn, incomeType === 'variable' && styles.activeToggle]} 
              onPress={() => setIncomeType('variable')}
            >
              <Text>Variable</Text>
            </Pressable>
          </View>
          
          {incomeType === 'fixed' ? (
            <TextInput 
              style={styles.input} 
              placeholder="Monthly Salary" 
              keyboardType="numeric"
              value={salary} 
              onChangeText={setSalary} 
            />
          ) : (
             <View style={{ gap: 10 }}>
                {INCOME_RANGES.map((range) => (
                  <Pressable 
                    key={range} 
                    style={[styles.textChip, variableRange === range && styles.activeChip]} 
                    onPress={() => setVariableRange(range)}
                  >
                    <Text>{range}</Text>
                  </Pressable>
                ))}
             </View>
          )}
        </>
      ) : (
        <>
          <Text style={styles.sectionLabel}>Primary Crop</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Rice / Wheat / Cotton" 
            value={cropType} 
            onChangeText={setCropType} 
          />
          
          <Text style={styles.sectionLabel}>Land Holding</Text>
          <View style={{ gap: 10 }}>
            {LAND_HOLDINGS.map((land) => (
              <Pressable 
                key={land} 
                style={[styles.textChip, landHolding === land && styles.activeChip]} 
                onPress={() => setLandHolding(land)}
              >
                <Text>{land}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Income Pattern</Text>
          <View style={{ gap: 10 }}>
            {INCOME_PATTERNS.map((pattern) => (
              <Pressable 
                key={pattern} 
                style={[styles.textChip, incomePattern === pattern && styles.activeChip]} 
                onPress={() => setIncomePattern(pattern)}
              >
                <Text>{pattern}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionLabel}>Current Balance</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Available Cash / Bank Balance" 
        keyboardType="numeric" 
        value={currentBalance} 
        onChangeText={setCurrentBalance} 
      />

      <Pressable style={styles.centeredSubmitButton} onPress={submitRegistration}>
        <Text style={styles.buttonText}>FINALIZE ACCOUNT</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F6F3EA', padding: 24 },
  headerTitle: { fontSize: 32, fontWeight: '700', color: '#8B0A2A', textAlign: 'center', marginBottom: 24 },
  sectionLabel: { fontSize: 18, fontWeight: '600', marginVertical: 12, color: '#8B0A2A' },
  input: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E7D7DA' },
  grid3x2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridBox: { width: '48%', padding: 20, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E7D7DA' },
  activeGridBox: { backgroundColor: '#FBECEF', borderColor: '#8B0A2A' },
  textChip: { backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E7D7DA' },
  activeChip: { backgroundColor: '#FBECEF', borderColor: '#8B0A2A' },
  toggleContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  toggleBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', borderWidth: 1, borderColor: '#E7D7DA' },
  activeToggle: { backgroundColor: '#FBECEF', borderColor: '#8B0A2A' },
  centeredSubmitButton: { marginTop: 30, backgroundColor: '#8B0A2A', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 40 },
  buttonText: { color: '#FFF', fontWeight: '700', fontSize: 18 },
});