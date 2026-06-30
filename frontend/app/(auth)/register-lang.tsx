import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

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

export default function RegisterLanguageScreen() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleNext = () => {
    // Pass language state to the next screen via URL params
    router.push({ pathname: '/register-basic', params: { language: selectedLanguage } });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.languageTitle}>Choose Language</Text>
      <Text style={styles.languageSubtitle}>अपनी भाषा, अपनी पसंद</Text>

      <View style={styles.languageList}>
        {INDIAN_LANGUAGES.map((lang) => (
          <Pressable
            key={lang.id}
            style={[styles.languageCard, selectedLanguage === lang.id && styles.languageCardActive]}
            onPress={() => setSelectedLanguage(lang.id)}
          >
            <Text style={{ fontWeight: '600', color: '#8B0A2A' }}>{lang.name}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.centeredSubmitButton} onPress={handleNext}>
        <Text style={styles.buttonText}>CONTINUE</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F6F3EA', padding: 24, justifyContent: 'center' },
  languageTitle: { fontSize: 28, fontWeight: '700', color: '#8B0A2A', textAlign: 'center' },
  languageSubtitle: { textAlign: 'center', color: '#8B0A2A', marginVertical: 16 },
  languageList: { gap: 12 },
  languageCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E7D7DA' },
  languageCardActive: { backgroundColor: '#FBECEF', borderColor: '#8B0A2A' },
  centeredSubmitButton: { marginTop: 30, backgroundColor: '#8B0A2A', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '700', fontSize: 18 },
}); 