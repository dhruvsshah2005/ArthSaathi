import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function WelcomeDashboard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.topSection}>
        <Text style={styles.logo}>₹</Text>
        <Text style={styles.title}>ArthSaathi AI</Text>
        <Text style={styles.subtitle}>
          Your AI Financial Companion
        </Text>
      </View>

      {/* Illustration Placeholder */}
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

      {/* CTA Section */}
      <View style={styles.bottomSection}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push('/register')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>

        <Text style={styles.languageText}>
          Choose Language →
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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

  heroEmoji: {
    fontSize: 80,
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
});