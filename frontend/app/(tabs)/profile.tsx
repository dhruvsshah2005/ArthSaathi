import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { openDB } from '../../lib/database';

const safeSetItem = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.log(`[Storage] safeSetItem error for ${key}:`, e);
  }
};

const safeDeleteItem = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    console.log(`[Storage] safeDeleteItem error for ${key}:`, e);
  }
};

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
const INDIAN_LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'hi', name: 'हिन्दी (Hindi)' },
  { id: 'mr', name: 'मराठी (Marathi)' },
  { id: 'ta', name: 'தமிழ் (Tamil)' },
  { id: 'te', name: 'తెలుగు (Telugu)' },
  { id: 'bn', name: 'বাংলা (Bengali)' },
  { id: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { id: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
];

interface UserProfile {
  profile_id: string;
  user_id: string;
  name: string;
  language_code: string;
  occupation_type: string;
  education_level: string;
  income_type: string;
  income_value: string;
  current_balance: number;
  crop_type: string | null;
  land_holding: string | null;
  income_pattern: string | null;
  trust_score: number;
  is_blind: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Form State variables
  const [name, setName] = useState<string>('');
  const [selectedOccupation, setSelectedOccupation] = useState<string>('');
  const [selectedEducation, setSelectedEducation] = useState<string>('');
  const [incomeType, setIncomeType] = useState<string>('fixed');
  const [salary, setSalary] = useState<string>('');
  const [variableRange, setVariableRange] = useState<string>('');
  const [currentBalance, setCurrentBalance] = useState<string>('');
  const [cropType, setCropType] = useState<string>('');
  const [landHolding, setLandHolding] = useState<string>('');
  const [incomePattern, setIncomePattern] = useState<string>('');
  const [isBlind, setIsBlind] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  // Load profile when focusing on page
  useFocusEffect(
    React.useCallback(() => {
      loadProfileData();
    }, [])
  );

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const userId = await SecureStore.getItemAsync('active_user_id');
      if (!userId) {
        setLoading(false);
        router.replace('/(auth)/login');
        return;
      }
      setActiveUserId(userId);

      const db = await openDB();
      const rows = await db.getAllAsync<UserProfile>(
        'SELECT * FROM parametric_profiles WHERE user_id = ? LIMIT 1',
        [userId]
      );

      if (rows && rows.length > 0) {
        const p = rows[0];
        setName(p.name || '');
        setSelectedLanguage(p.language_code || 'en');
        setSelectedOccupation(p.occupation_type || '');
        setSelectedEducation(p.education_level || '');
        setIncomeType(p.income_type || 'fixed');
        if (p.income_type === 'fixed') {
          setSalary(p.income_value || '');
          setVariableRange('');
        } else {
          setVariableRange(p.income_value || '');
          setSalary('');
        }
        setCurrentBalance(p.current_balance ? p.current_balance.toString() : '0');
        setCropType(p.crop_type || '');
        setLandHolding(p.land_holding || '');
        setIncomePattern(p.income_pattern || '');
        setIsBlind(p.is_blind === 1);
      }
    } catch (e) {
      console.log('Failed to fetch profile settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name.');
      return;
    }
    if (!selectedOccupation) {
      Alert.alert('Validation Error', 'Please select an occupation.');
      return;
    }
    if (!selectedEducation) {
      Alert.alert('Validation Error', 'Please select your education level.');
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const db = await openDB();

      // 1. Update local SQLite DB (Safeguard: convert isBlind to 1 or 0 for Android SQLite constraint)
      await db.runAsync(
        `UPDATE parametric_profiles SET 
          name = ?, 
          language_code = ?, 
          occupation_type = ?, 
          education_level = ?, 
          income_type = ?, 
          income_value = ?, 
          current_balance = ?, 
          crop_type = ?, 
          land_holding = ?, 
          income_pattern = ?, 
          is_blind = ?
        WHERE user_id = ?`,
        [
          name.trim(),
          selectedLanguage,
          selectedOccupation,
          selectedEducation,
          incomeType,
          incomeType === 'fixed' ? salary : variableRange,
          parseFloat(currentBalance) || 0,
          selectedOccupation === 'farmer' ? cropType.trim() : null,
          selectedOccupation === 'farmer' ? landHolding : null,
          selectedOccupation === 'farmer' ? incomePattern : null,
          isBlind ? 1 : 0, // EXPO SQLITE ANDROID CONSTRAINT: strictly convert boolean to 1/0
          activeUserId
        ]
      );

      // 2. Sync to Backend
      if (activeUserId && process.env.EXPO_PUBLIC_API_URL) {
        try {
          await axios.put(
            `${process.env.EXPO_PUBLIC_API_URL}/api/profile/update`,
            {
              user_id: activeUserId,
              name: name.trim(),
              language_code: selectedLanguage,
              occupation_type: selectedOccupation,
              education_level: selectedEducation,
              income_type: incomeType,
              income_value: incomeType === 'fixed' ? salary : variableRange,
              current_balance: parseFloat(currentBalance) || 0,
              crop_type: selectedOccupation === 'farmer' ? cropType.trim() : null,
              land_holding: selectedOccupation === 'farmer' ? landHolding : null,
              income_pattern: selectedOccupation === 'farmer' ? incomePattern : null,
              is_blind: isBlind // Boolean format is accepted in standard FastAPI JSON payload
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
              },
              timeout: 10000,
            }
          );
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Profile Saved', 'Your profile details have been saved and synced to the cloud.');
        } catch (netError) {
          console.log('Failed to sync updated profile to backend, storing offline:', netError);
          
          // Save a sync queue file locally using safeSetItem
          await safeSetItem(
            `pending_profile_update_${activeUserId}`,
            JSON.stringify({
              user_id: activeUserId,
              name: name.trim(),
              language_code: selectedLanguage,
              occupation_type: selectedOccupation,
              education_level: selectedEducation,
              income_type: incomeType,
              income_value: incomeType === 'fixed' ? salary : variableRange,
              current_balance: parseFloat(currentBalance) || 0,
              crop_type: selectedOccupation === 'farmer' ? cropType.trim() : null,
              land_holding: selectedOccupation === 'farmer' ? landHolding : null,
              income_pattern: selectedOccupation === 'farmer' ? incomePattern : null,
              is_blind: isBlind
            })
          );
          
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(
            'Saved Locally',
            "Profile saved locally. We will sync these parameters online once network is restored!"
          );
        }
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Save Failed', `Unable to update profile settings: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your ArthaSaathi account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              await safeDeleteItem('active_user_id');
              await safeDeleteItem('completed_learnings');
              router.replace('/(auth)/login');
            } catch (err) {
              console.log('Error logging out:', err);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0A2A" />
        <Text style={styles.loadingText}>Fetching profile settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>Profile Settings</Text>

      {/* Name Input */}
      <Text style={styles.sectionLabel}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
      />

      {/* Occupation */}
      <Text style={styles.sectionLabel}>Occupation</Text>
      <View style={styles.grid3x2}>
        {OCCUPATIONS.map((occ) => (
          <Pressable
            key={occ.id}
            style={[styles.gridBox, selectedOccupation === occ.id && styles.activeGridBox]}
            onPress={() => setSelectedOccupation(occ.id)}
          >
            <Text style={[styles.gridText, selectedOccupation === occ.id && styles.activeGridText]}>
              {occ.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Education */}
      <Text style={styles.sectionLabel}>Education</Text>
      <View style={{ gap: 10 }}>
        {EDUCATION_LEVELS.map((edu) => (
          <Pressable
            key={edu.id}
            style={[styles.textChip, selectedEducation === edu.id && styles.activeChip]}
            onPress={() => setSelectedEducation(edu.id)}
          >
            <Text style={[styles.chipText, selectedEducation === edu.id && styles.activeChipText]}>
              {edu.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Dynamic farmer details */}
      {selectedOccupation === 'farmer' ? (
        <>
          <Text style={styles.sectionLabel}>Primary Crop</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rice / Wheat / Cotton"
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
                <Text style={[styles.chipText, landHolding === land && styles.activeChipText]}>
                  {land}
                </Text>
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
                <Text style={[styles.chipText, incomePattern === pattern && styles.activeChipText]}>
                  {pattern}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <>
          <Text style={styles.sectionLabel}>Income Type</Text>
          <View style={styles.toggleContainer}>
            <Pressable
              style={[styles.toggleBtn, incomeType === 'fixed' && styles.activeToggle]}
              onPress={() => setIncomeType('fixed')}
            >
              <Text style={[styles.toggleText, incomeType === 'fixed' && styles.activeToggleText]}>
                Fixed
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, incomeType === 'variable' && styles.activeToggle]}
              onPress={() => setIncomeType('variable')}
            >
              <Text style={[styles.toggleText, incomeType === 'variable' && styles.activeToggleText]}>
                Variable
              </Text>
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
                  <Text style={[styles.chipText, variableRange === range && styles.activeChipText]}>
                    {range}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}

      {/* Balance */}
      <Text style={styles.sectionLabel}>Current Balance</Text>
      <TextInput
        style={styles.input}
        placeholder="Available Cash / Bank Balance"
        keyboardType="numeric"
        value={currentBalance}
        onChangeText={setCurrentBalance}
      />

      {/* Language */}
      <Text style={styles.sectionLabel}>Choose App Language</Text>
      <View style={{ gap: 10 }}>
        {INDIAN_LANGUAGES.map((lang) => (
          <Pressable
            key={lang.id}
            style={[styles.textChip, selectedLanguage === lang.id && styles.activeChip]}
            onPress={() => setSelectedLanguage(lang.id)}
          >
            <Text style={[styles.chipText, selectedLanguage === lang.id && styles.activeChipText]}>
              {lang.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Impairment toggle */}
      <Text style={styles.sectionLabel}>Visually Impaired / Voice Assistant</Text>
      <View style={styles.toggleContainer}>
        <Pressable
          style={[styles.toggleBtn, isBlind === true && styles.activeToggle]}
          onPress={() => setIsBlind(true)}
        >
          <Text style={[styles.toggleText, isBlind === true && styles.activeToggleText]}>
            Yes, assist me
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, isBlind === false && styles.activeToggle]}
          onPress={() => setIsBlind(false)}
        >
          <Text style={[styles.toggleText, isBlind === false && styles.activeToggleText]}>
            No, normal mode
          </Text>
        </Pressable>
      </View>

      {/* Save Details button */}
      <Pressable style={styles.centeredSubmitButton} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>SAVE PROFILE CHANGES</Text>
        )}
      </Pressable>

      {/* Logout button */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>LOG OUT</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F6F3EA',
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#8B0A2A',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B0A2A',
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7D7DA',
    fontSize: 14,
    color: '#374151',
  },
  grid3x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridBox: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7D7DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeGridBox: {
    backgroundColor: '#FBECEF',
    borderColor: '#8B0A2A',
  },
  gridText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  activeGridText: {
    color: '#8B0A2A',
  },
  textChip: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7D7DA',
  },
  activeChip: {
    backgroundColor: '#FBECEF',
    borderColor: '#8B0A2A',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  activeChipText: {
    color: '#8B0A2A',
    fontWeight: '700',
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7D7DA',
  },
  activeToggle: {
    backgroundColor: '#FBECEF',
    borderColor: '#8B0A2A',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  activeToggleText: {
    color: '#8B0A2A',
    fontWeight: '700',
  },
  centeredSubmitButton: {
    marginTop: 40,
    backgroundColor: '#8B0A2A',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 16,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 60,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F3EA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
});
