import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Dimensions,
  Image,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { openDB } from '../../lib/database';
import * as Crypto from 'expo-crypto';

// Import our custom widgets
import BlindVoice from '@/components/blind-voice';
import EmergencyFund from '@/components/emergency-fund';
import FinancialScore from '@/components/financial-score';
import GovtSchemes from '@/components/govt-schemes';
import ExpenditureAnalytics from '@/components/expenditure-analytics';

const { width } = Dimensions.get('window');

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
  is_blind: number;
  trust_score: number;
}

export default function WelcomeDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [isAudioModalVisible, setAudioModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch profile settings on mount/focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      const activeUserId = await SecureStore.getItemAsync('active_user_id');
      if (!activeUserId) {
        setProfile(null);
        return;
      }
      const db = await openDB();
      const rows = await db.getAllAsync<UserProfile>(
        'SELECT * FROM parametric_profiles WHERE user_id = ? LIMIT 1',
        [activeUserId]
      );
      if (rows && rows.length > 0) {
        setProfile(rows[0]);
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.log('Failed to fetch user profile:', e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyIncomeValue = (prof: UserProfile) => {
    if (prof.income_type === 'fixed') {
      return parseFloat(prof.income_value) || 0;
    }
    const value = prof.income_value || '';
    if (value.includes('60,000+')) return 60000;
    if (value.includes('30,001')) return 45000;
    if (value.includes('15,001')) return 22500;
    return 7500;
  };

  const handleMockTranscribe = async () => {
    if (!profile) return;
    setIsProcessing(true);
    
    // Simulate processing delay
    setTimeout(async () => {
      try {
        const db = await openDB();
        const transactionId = Crypto.randomUUID();
        const amount = 150;
        const type = 'debit';
        const reason = 'Mock: Milk purchase';

        await db.runAsync(
          `INSERT INTO transactions (transaction_id, user_id, amount, type, reason, synced) VALUES (?, ?, ?, ?, ?, 0)`,
          [transactionId, profile.user_id, amount, type, reason]
        );

        await db.runAsync(
          `UPDATE parametric_profiles SET current_balance = current_balance - ? WHERE user_id = ?`,
          [amount, profile.user_id]
        );

        setAudioModalVisible(false);
        setIsProcessing(false);
        Alert.alert('Success', 'Recorded: -₹150 for Milk purchase');
        loadUserProfile(); // Instantly refresh the dashboard balance!
      } catch (error) {
        console.error('Failed to save mock transaction:', error);
        setIsProcessing(false);
        Alert.alert('Error', 'Failed to save transaction.');
      }
    }, 1500);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0A2A" />
      </View>
    );
  }

  // --- CASE 1: No User Onboarded yet -> Render Welcome Screen ---
  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.topSection}>
          <Text style={styles.logo}>₹</Text>
          <Text style={styles.title}>ArthSaathi AI</Text>
          <Text style={styles.subtitle}>Your AI Financial Companion</Text>
        </View>

        <View style={styles.heroSection}>
          <View style={styles.circle}>
            <Image source={require('../../assets/images/gl.png')} style={styles.image} />
          </View>
          <Text style={styles.tagline}>
            Smart advice.{'\n'}
            Better decisions.{'\n'}
            Stronger future.
          </Text>
        </View>

        <View style={styles.bottomSection}>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={() => router.push('/register-lang')}
          >
            <Text style={styles.buttonText}>Sign Up</Text>
          </Pressable>
          
          <Pressable
            style={({ pressed }) => [styles.loginLinkBtn, pressed && styles.buttonPressed]}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginLinkText}>Have an account? Log In</Text>
          </Pressable>
          <Text style={styles.languageText}>Choose Language →</Text>
        </View>
      </View>
    );
  }

  // --- CASE 2: Visually Impaired (Blind) Dashboard ---
  if (profile.is_blind === 1) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1E1E1E' }}>
        <BlindVoice
          onVoiceAssistantPress={() => router.push('/chat')}
          onAudioLedgerPress={() => {}}
          onSummaryPress={() => {}}
        />
      </View>
    );
  }

  const monthlyIncome = getMonthlyIncomeValue(profile);

  // --- CASE 3: Standard Dashboards (Highly Educated, Farmer, Variable Income, etc.) ---
  return (
    <View style={{ flex: 1, backgroundColor: '#F6F3EA' }}>
      <ScrollView contentContainerStyle={styles.dashboardScroll}>
        {/* Greetings & Balance Header */}
        <View style={styles.dashboardHeader}>
          <Text style={styles.greetingText}>Hello, {profile.name} 👋</Text>
          <Text style={styles.occupationLabel}>
            {profile.occupation_type.toUpperCase().replace('_', ' ')} • {profile.education_level.toUpperCase().replace('_', ' ')}
          </Text>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Total Balance</Text>
            <Text style={styles.balanceValue}>₹{profile.current_balance.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Conditionally Render Content Widgets based on Persona */}

        {/* A. Highly Educated (>12th pass) gets text-dense analytical layout */}
        {profile.education_level === '12th_pass_above' && (
          <>
            <FinancialScore score={profile.trust_score} />
            <ExpenditureAnalytics />
          </>
        )}

        {/* B. Farmer gets Government Schemes and 10-month emergency fund widget */}
        {profile.occupation_type === 'farmer' && (
          <>
            <EmergencyFund currentBalance={profile.current_balance} monthlyIncome={monthlyIncome} isFarmer={true} />
            <GovtSchemes />
          </>
        )}

        {/* C. Variable Income Earner gets 3-month emergency fund widget */}
        {profile.occupation_type !== 'farmer' && profile.income_type === 'variable' && (
          <EmergencyFund currentBalance={profile.current_balance} monthlyIncome={monthlyIncome} isFarmer={false} />
        )}

      </ScrollView>

      {/* Persistent Floating Audio Khata Button */}
      <Pressable
        style={({ pressed }) => [styles.floatingButton, pressed && styles.floatingButtonPressed]}
        onPress={() => setAudioModalVisible(true)}
      >
        <Text style={styles.floatingButtonIcon}>🎙️</Text>
        <Text style={styles.floatingButtonText}>Audio Khata</Text>
      </Pressable>

      {/* Audio Khata Modal Overlay */}
      <Modal
        visible={isAudioModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isProcessing && setAudioModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Audio Khata</Text>
            <Text style={styles.modalSubtitle}>Speak how much you spent or earned (e.g. "I spent 150 rupees on milk")</Text>
            
            <View style={[styles.micCircle, isProcessing && styles.micCircleProcessing]}>
              <Text style={styles.bigMic}>🎙️</Text>
            </View>
            <Text style={styles.listeningText}>
              {isProcessing ? 'Processing...' : 'Listening...'}
            </Text>

            {isProcessing && <ActivityIndicator size="large" color="#8B0A2A" style={{ marginTop: 20 }} />}

            {!isProcessing && (
              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setAudioModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.modalBtn, styles.mockBtn]}
                  onPress={handleMockTranscribe}
                >
                  <Text style={styles.mockBtnText}>Mock Transcribe</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F3EA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F6F3EA',
    justifyContent: 'space-between',
    paddingVertical: 70,
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 42,
    color: '#8B0A2A',
    marginBottom: 8,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#8B0A2A',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  heroSection: {
    alignItems: 'center',
  },
  circle: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: 999,
    backgroundColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  tagline: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 34,
  },
  image: {
    width: '90%',
    height: '90%',
    resizeMode: 'cover',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: '#8B0A2A',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#8B0A2A',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  languageText: {
    marginTop: 22,
    color: '#8B0A2A',
    fontSize: 16,
    fontWeight: '500',
  },
  loginLinkBtn: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8B0A2A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  loginLinkText: {
    color: '#8B0A2A',
    fontSize: 16,
    fontWeight: '700',
  },

  // Dashboard Styles
  dashboardScroll: {
    flexGrow: 1,
    backgroundColor: '#F6F3EA',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 100, // Extra padding so scroll doesn't hide behind button
  },
  dashboardHeader: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  occupationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: '#8B0A2A',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#8B0A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#FBECEF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 8,
  },

  // Floating Button & Modal
  floatingButton: {
    position: 'absolute',
    bottom: 24, 
    right: 24,
    backgroundColor: '#8B0A2A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#8B0A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  floatingButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  floatingButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  micCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  micCircleProcessing: {
    backgroundColor: '#E5E7EB',
  },
  bigMic: {
    fontSize: 48,
  },
  listeningText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B0A2A',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    color: '#4B5563',
    fontWeight: '700',
    fontSize: 14,
  },
  mockBtn: {
    backgroundColor: '#8B0A2A',
  },
  mockBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});