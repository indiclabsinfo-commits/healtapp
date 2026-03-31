import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, glassCard, gradientColors } from '../theme/colors';
import { useAuthStore } from '../store/auth';
import api from '../config/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function OrgCodeScreen({ navigation }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const setSelectedOrg = useAuthStore((s) => s.setSelectedOrg);

  const handleContinue = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter an organization code.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/organizations/code/${encodeURIComponent(trimmed)}`);
      const org = response.data.data;

      await setSelectedOrg({
        id: org.id,
        name: org.name,
        code: trimmed,
      });

      // Navigate back to login so user can sign in with the org context
      navigation.navigate('Login');
    } catch (error: any) {
      const message =
        error.response?.data?.error || 'Invalid organization code. Please try again.';
      Alert.alert('Not Found', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🏢</Text>
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Organization{'\n'}Code</Text>
          <Text style={styles.subtitle}>
            Enter the code provided by your organization to link your account
          </Text>
        </View>

        {/* Code Input */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>ORGANIZATION CODE</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. MINDCARE-2026"
              placeholderTextColor={colors.textMuted}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            onPress={handleContinue}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaButton}
            >
              {loading ? (
                <ActivityIndicator color={colors.ctaText} />
              ) : (
                <Text style={styles.ctaText}>Continue</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Info card */}
          <View style={[styles.infoCard, glassCard]}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.accentPrimary}
            />
            <Text style={styles.infoText}>
              Your organization admin should have shared this code with you.
              Contact them if you don't have it.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(111,255,233,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 36,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
  },
  ctaButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: colors.ctaText,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginTop: 24,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
