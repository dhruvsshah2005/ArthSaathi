import React from 'react';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';

const SCHEMES = [
  {
    id: 'pm_kisan',
    title: '🌾 PM-KISAN',
    desc: 'Income support of ₹6,000 per year in three equal installments to small and marginal farmer families.',
  },
  {
    id: 'fasal_bima',
    title: '🛡️ PM Fasal Bima Yojana',
    desc: 'Crop insurance scheme providing financial support to farmers suffering crop loss/damage due to natural calamities.',
  },
  {
    id: 'sinchayee',
    title: '💧 PM Krishi Sinchayee Yojana',
    desc: 'Government program promoting water-saving technologies ("Per Drop More Crop") and improving on-farm water use efficiency.',
  },
];

export default function GovtSchemes() {
  const handleApply = (title: string) => {
    Alert.alert('Apply for Scheme', `Connecting to official portal for ${title}...`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏛️ Government Schemes for Farmers</Text>
      
      {SCHEMES.map((scheme) => (
        <View key={scheme.id} style={styles.schemeCard}>
          <Text style={styles.schemeTitle}>{scheme.title}</Text>
          <Text style={styles.schemeDesc}>{scheme.desc}</Text>
          
          <Pressable 
            style={({ pressed }) => [styles.applyBtn, pressed && styles.pressed]}
            onPress={() => handleApply(scheme.title)}
          >
            <Text style={styles.applyBtnText}>Apply Now</Text>
          </Pressable>
        </View>
      ))}
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
  schemeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  schemeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  schemeDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 12,
  },
  applyBtn: {
    backgroundColor: '#8B0A2A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  pressed: {
    opacity: 0.9,
  },
});
