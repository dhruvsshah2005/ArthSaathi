import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import * as Crypto from 'expo-crypto';
import { openDB } from '../lib/database';

interface Transaction {
  transaction_id: string;
  user_id: string;
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  synced: number;
  created_at: string;
}

interface AudioLedgerProps {
  userId: string;
  onBalanceUpdated?: () => void;
}

export default function AudioLedger({ userId, onBalanceUpdated }: AudioLedgerProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load transactions on mount
  useEffect(() => {
    loadTransactions();
  }, [userId]);

  const loadTransactions = async () => {
    try {
      const db = await openDB();
      const rows = await db.getAllAsync<Transaction>(
        `SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
        [userId]
      );
      setTransactions(rows);
    } catch (error) {
      console.error('Failed to load local transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (type: 'credit' | 'debit') => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Missing Reason', 'Please enter where or why the money was spent/earned.');
      return;
    }

    try {
      const db = await openDB();
      const transactionId = Crypto.randomUUID();
      
      // Save locally to SQLite with synced = 0 (offline-first)
      await db.runAsync(
        `INSERT INTO transactions (transaction_id, user_id, amount, type, reason, synced) VALUES (?, ?, ?, ?, ?, 0)`,
        [transactionId, userId, parsedAmount, type, reason.trim()]
      );

      // Adjust user's current balance locally in SQLite
      const balanceChange = type === 'credit' ? parsedAmount : -parsedAmount;
      await db.runAsync(
        `UPDATE parametric_profiles SET current_balance = current_balance + ? WHERE user_id = ?`,
        [balanceChange, userId]
      );

      setAmount('');
      setReason('');
      Alert.alert('Success', `Recorded locally as offline transaction!`);
      
      // Reload lists and trigger dashboard balance updates
      loadTransactions();
      if (onBalanceUpdated) {
        onBalanceUpdated();
      }
    } catch (error) {
      console.error('Failed to save offline transaction:', error);
      Alert.alert('Error', 'Failed to save transaction.');
    }
  };

  const handleAudioPress = () => {
    setIsRecording(true);
    Alert.alert(
      'Audio Khata (Voice Input)',
      'Speak how much you spent or earned (e.g. "I spent 150 rupees on milk")',
      [
        {
          text: 'Cancel',
          onPress: () => setIsRecording(false),
          style: 'cancel',
        },
        {
          text: 'Mock Transcribe',
          onPress: () => {
            setIsRecording(false);
            setAmount('150');
            setReason('Milk purchase');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎙️ Audio Khata Ledger</Text>
      
      {/* Input Section */}
      <View style={styles.inputContainer}>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="Amount (₹)"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <Pressable 
            style={[styles.micBtn, isRecording && styles.recordingMic]} 
            onPress={handleAudioPress}
          >
            <Text style={styles.micText}>{isRecording ? '⏺️' : '🎙️'}</Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Reason / Item (e.g., Vegetables, Salary)"
          value={reason}
          onChangeText={setReason}
        />

        <View style={styles.actionRow}>
          <Pressable 
            style={[styles.actionBtn, styles.debitBtn]} 
            onPress={() => handleAddTransaction('debit')}
          >
            <Text style={styles.actionText}>- Spend (Debit)</Text>
          </Pressable>
          <Pressable 
            style={[styles.actionBtn, styles.creditBtn]} 
            onPress={() => handleAddTransaction('credit')}
          >
            <Text style={styles.actionText}>+ Earn (Credit)</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.subtitle}>Recent Ledger Entries</Text>

      {loading ? (
        <ActivityIndicator color="#8B0A2A" style={{ marginVertical: 10 }} />
      ) : transactions.length === 0 ? (
        <Text style={styles.emptyText}>No local transactions recorded yet.</Text>
      ) : (
        <View style={styles.list}>
          {transactions.map((tx) => {
            const isCredit = tx.type === 'credit';
            return (
              <View key={tx.transaction_id} style={styles.txRow}>
                <View style={styles.txLeft}>
                  <Text style={styles.txReason}>{tx.reason}</Text>
                  <Text style={styles.txTime}>
                    {new Date(tx.created_at).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, isCredit ? styles.creditText : styles.debitText]}>
                    {isCredit ? '+' : '-'} ₹{tx.amount}
                  </Text>
                  <Text style={[styles.syncText, tx.synced === 1 ? styles.synced : styles.offline]}>
                    {tx.synced === 1 ? '☁️ Synced' : '⏳ Offline'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7D7DA',
    marginBottom: 16,
    shadowColor: '#8B0A2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B0A2A',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
  },
  micBtn: {
    backgroundColor: '#8B0A2A',
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingMic: {
    backgroundColor: '#EF4444',
  },
  micText: {
    fontSize: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  debitBtn: {
    backgroundColor: '#EF4444',
  },
  creditBtn: {
    backgroundColor: '#10B981',
  },
  actionText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginVertical: 12,
  },
  list: {
    gap: 10,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  txLeft: {
    flex: 1.2,
  },
  txReason: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  txTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  txRight: {
    flex: 0.8,
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  creditText: {
    color: '#10B981',
  },
  debitText: {
    color: '#EF4444',
  },
  syncText: {
    fontSize: 10,
    fontWeight: '700',
  },
  synced: {
    color: '#10B981',
  },
  offline: {
    color: '#F59E0B',
  },
});
