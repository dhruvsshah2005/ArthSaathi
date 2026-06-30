import React from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

interface BlindVoiceProps {
  onVoiceAssistantPress?: () => void;
  onAudioLedgerPress?: () => void;
  onSummaryPress?: () => void;
}

export default function BlindVoice({
  onVoiceAssistantPress,
  onAudioLedgerPress,
  onSummaryPress,
}: BlindVoiceProps) {
  return (
    <View style={styles.container}>
      {/* Upper Half: Voice Assistant */}
      <Pressable 
        style={({ pressed }) => [styles.upperHalf, pressed && styles.pressed]}
        onPress={onVoiceAssistantPress}
      >
        <Text style={styles.icon}>🎙️</Text>
        <Text style={styles.title}>Voice Assistant</Text>
        <Text style={styles.subtitle}>Tap anywhere on the top half to ask anything</Text>
      </Pressable>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Lower Half: Split Left/Right */}
      <View style={styles.lowerHalf}>
        {/* Lower Left: Audio Khata */}
        <Pressable 
          style={({ pressed }) => [styles.leftHalf, pressed && styles.pressed]}
          onPress={onAudioLedgerPress}
        >
          <Text style={styles.smallIcon}>🚜</Text>
          <Text style={styles.smallTitle}>Audio Khata</Text>
          <Text style={styles.smallSubtitle}>Speak transaction</Text>
        </Pressable>

        {/* Vertical Divider */}
        <View style={styles.verticalDivider} />

        {/* Lower Right: Summary */}
        <Pressable 
          style={({ pressed }) => [styles.rightHalf, pressed && styles.pressed]}
          onPress={onSummaryPress}
        >
          <Text style={styles.smallIcon}>📊</Text>
          <Text style={styles.smallTitle}>Summary</Text>
          <Text style={styles.smallSubtitle}>Check ledger</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E', // High contrast dark mode for visual assistance
  },
  upperHalf: {
    flex: 1.1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8B0A2A',
    padding: 24,
  },
  divider: {
    height: 4,
    backgroundColor: '#FFF',
  },
  lowerHalf: {
    flex: 0.9,
    flexDirection: 'row',
  },
  leftHalf: {
    flex: 1,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  rightHalf: {
    flex: 1,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  verticalDivider: {
    width: 4,
    backgroundColor: '#FFF',
  },
  pressed: {
    opacity: 0.8,
    backgroundColor: '#A8183B',
  },
  icon: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#F9FAFB',
    textAlign: 'center',
    opacity: 0.9,
  },
  smallIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  smallTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  smallSubtitle: {
    fontSize: 12,
    color: '#D1D5DB',
    textAlign: 'center',
  },
});
