import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const CATEGORIES = [
  { name: 'Rent & Living', amount: 12400, percent: 40, color: '#EF4444' },
  { name: 'Groceries & Food', amount: 6200, percent: 20, color: '#F59E0B' },
  { name: 'Utilities & Bills', amount: 4650, percent: 15, color: '#3B82F6' },
  { name: 'Investment & Savings', amount: 4650, percent: 15, color: '#10B981' },
  { name: 'Others', amount: 3100, percent: 10, color: '#6B7280' },
];

export default function ExpenditureAnalytics() {
  const totalExpenditure = 31000;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Expense & Savings Analytics</Text>

      {/* Main Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Monthly Spent</Text>
          <Text style={styles.statValue}>₹{totalExpenditure.toLocaleString('en-IN')}</Text>
          <Text style={styles.statChange}>📉 -4% from last month</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Avg Daily Outflow</Text>
          <Text style={styles.statValue}>₹1,000</Text>
          <Text style={styles.statChange}>⚡ Stabilized</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Category Breakdown</Text>
      
      {/* Categories list with progress bars */}
      <View style={styles.list}>
        {CATEGORIES.map((cat, idx) => (
          <View key={idx} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={styles.catValue}>₹{cat.amount.toLocaleString('en-IN')} ({cat.percent}%)</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${cat.percent}%`, backgroundColor: cat.color }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Saving Trends */}
      <Text style={styles.sectionLabel}>Savings Trends</Text>
      <View style={styles.trendCard}>
        <View style={styles.trendRow}>
          <Text style={styles.trendText}>Target Savings (20%)</Text>
          <Text style={styles.trendTextBold}>₹6,200</Text>
        </View>
        <View style={styles.trendRow}>
          <Text style={styles.trendText}>Actual Saved</Text>
          <Text style={[styles.trendTextBold, { color: '#10B981' }]}>₹7,800</Text>
        </View>
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>🎉 Superb! You saved 25% of your income this month, beating your target by 5%.</Text>
        </View>
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
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginVertical: 4,
  },
  statChange: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    gap: 12,
    marginBottom: 20,
  },
  row: {
    width: '100%',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  catValue: {
    fontSize: 12,
    color: '#6B7280',
  },
  barBg: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  trendCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  trendText: {
    fontSize: 13,
    color: '#4B5563',
  },
  trendTextBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  messageBox: {
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  messageText: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 16,
    fontWeight: '600',
  },
});
