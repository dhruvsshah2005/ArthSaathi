import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EmergencyFundProps {
  currentBalance: number;
  monthlyIncome: number;
  isFarmer: boolean;
}

export default function EmergencyFund({
  currentBalance,
  monthlyIncome,
  isFarmer,
}: EmergencyFundProps) {
  // Target: 10 months for farmers, 3 months for others
  const targetMonths = isFarmer ? 10 : 3;
  const targetAmount = monthlyIncome * targetMonths;
  
  // Calculate progress
  const progress = targetAmount > 0 ? Math.min(currentBalance / targetAmount, 1) : 0;
  const isGoalMet = currentBalance >= targetAmount;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛡️ Emergency Fund</Text>
        <Text style={[styles.statusText, isGoalMet ? styles.met : styles.notMet]}>
          {isGoalMet ? 'Activated' : 'Locked'}
        </Text>
      </View>

      <Text style={styles.description}>
        {isFarmer 
          ? 'Farmers require a 10-month emergency fund to unlock long-term goals.' 
          : 'Variable income profiles require a 3-month emergency fund.'}
      </Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: isGoalMet ? '#10B981' : '#F59E0B' }]} />
        </View>
        <Text style={styles.percentageText}>{Math.round(progress * 100)}%</Text>
      </View>

      <View style={styles.footerRow}>
        <View>
          <Text style={styles.label}>Current Savings</Text>
          <Text style={styles.value}>₹{currentBalance.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.alignRight}>
          <Text style={styles.label}>Target ({targetMonths} Months)</Text>
          <Text style={styles.value}>₹{targetAmount.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {!isGoalMet && (
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>
            ⚠️ Save ₹{(targetAmount - currentBalance).toLocaleString('en-IN')} more to enable your Goals Tracker.
          </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B0A2A',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  met: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  notMet: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    width: 35,
    textAlign: 'right',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  alertBox: {
    marginTop: 16,
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
    textAlign: 'center',
  },
});
