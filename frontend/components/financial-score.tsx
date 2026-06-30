import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface FinancialScoreProps {
  score?: number;
}

export default function FinancialScore({ score = 75 }: FinancialScoreProps) {
  let assessment = 'Good';
  let color = '#3B82F6'; // Blue
  
  if (score >= 85) {
    assessment = 'Excellent';
    color = '#10B981'; // Green
  } else if (score >= 70) {
    assessment = 'Good';
    color = '#6366F1'; // Indigo
  } else if (score >= 50) {
    assessment = 'Fair';
    color = '#F59E0B'; // Orange
  } else {
    assessment = 'Needs Improvement';
    color = '#EF4444'; // Red
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 Financial Health Score</Text>
      
      <View style={styles.scoreRow}>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreValue, { color }]}>{score}</Text>
          <Text style={styles.scoreMax}>/ 100</Text>
        </View>

        <View style={styles.assessmentContainer}>
          <Text style={styles.label}>Status Rating</Text>
          <Text style={[styles.value, { color }]}>{assessment}</Text>
          <Text style={styles.advice}>
            {score >= 70 
              ? 'Great budget discipline! Keep tracking your transactions.' 
              : 'Add more offline records to build up your trust profile.'}
          </Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.tipsBox}>
        <Text style={styles.tipsTitle}>💡 Tips to Improve Score:</Text>
        <Text style={styles.tipText}>• Record transactions daily in Audio Khata</Text>
        <Text style={styles.tipText}>• Clear your monthly pending credit/debit balances</Text>
        <Text style={styles.tipText}>• Meet your monthly emergency fund savings target</Text>
      </View>
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
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: -2,
  },
  assessmentContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 4,
  },
  advice: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  tipsBox: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
});
