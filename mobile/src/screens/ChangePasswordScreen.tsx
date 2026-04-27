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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, glassCard } from '../theme/colors';
import api from '../config/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ChangePasswordScreen({ navigation }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (saving) return;
    if (!current || !next) {
      Alert.alert('Required', 'Enter your current and new passwords.');
      return;
    }
    if (next.length < 8) {
      Alert.alert('Weak password', 'New password must be at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: current, newPassword: next });
      Alert.alert('Success', 'Password changed successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={styles.title}>Change Password</Text>
        </View>

        <View style={[glassCard, styles.card]}>
          <Text style={styles.label}>Current password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={current}
              onChangeText={setCurrent}
              secureTextEntry={!showCurrent}
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              placeholder="Enter current password"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} accessibilityLabel={showCurrent ? 'Hide password' : 'Show password'}>
              <Ionicons name={showCurrent ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>New password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={next}
              onChangeText={setNext}
              secureTextEntry={!showNext}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity onPress={() => setShowNext(!showNext)} accessibilityLabel={showNext ? 'Hide password' : 'Show password'}>
              <Ionicons name={showNext ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Use a strong password with at least 8 characters.</Text>

          <Text style={[styles.label, { marginTop: 16 }]}>Confirm new password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="Re-enter new password"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.cta, saving && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={saving}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator color={colors.bgPrimary} />
          ) : (
            <Text style={styles.ctaText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { padding: 20, paddingBottom: 80 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, marginTop: 12 },
  backButton: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderCard,
  },
  title: { fontSize: 20, fontWeight: '600', color: colors.textPrimary },
  card: { padding: 20, borderRadius: 16, marginBottom: 24 },
  label: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: colors.textMuted, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: colors.inputBg, borderRadius: 14,
    borderWidth: 1, borderColor: colors.inputBorder,
  },
  input: { flex: 1, color: colors.textPrimary, fontSize: 13 },
  hint: { fontSize: 10, color: colors.textMuted, marginTop: 6 },
  cta: {
    backgroundColor: colors.accentPrimary, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { color: colors.bgPrimary, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
});
