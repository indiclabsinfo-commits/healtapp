import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { colors, glassCard } from '../theme/colors';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

const LANG_KEY = 'ambrin.lang';

const LANGS: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'gu', label: 'ગુજરાતી' },
];

export default function SettingsScreen({ navigation }: Props) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    SecureStore.getItemAsync(LANG_KEY).then((v) => {
      if (v && LANGS.some((l) => l.code === v)) setLang(v);
    });
  }, []);

  async function changeLang(code: string) {
    setLang(code);
    await SecureStore.setItemAsync(LANG_KEY, code);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={[glassCard, styles.section]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="globe-outline" size={14} color={colors.accentPrimary} />
            <Text style={styles.sectionTitle}>Language</Text>
          </View>
          {LANGS.map((l) => {
            const active = lang === l.code;
            return (
              <TouchableOpacity
                key={l.code}
                onPress={() => changeLang(l.code)}
                style={[styles.langRow, active && styles.langRowActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.langText, active && styles.langTextActive]}>{l.label}</Text>
                {active && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
          <Text style={styles.hint}>Language preference applies to assessment questions and feedback.</Text>
        </View>

        <View style={[glassCard, styles.section]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={14} color={colors.accentPrimary} />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          <View style={styles.aboutRow}><Text style={styles.aboutLabel}>App</Text><Text style={styles.aboutValue}>ambrin</Text></View>
          <View style={styles.aboutRow}><Text style={styles.aboutLabel}>Version</Text><Text style={styles.aboutValue}>1.0.0</Text></View>
        </View>
      </ScrollView>
    </View>
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
  section: { padding: 20, borderRadius: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  langRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
  },
  langRowActive: { backgroundColor: 'rgba(111,255,233,0.12)' },
  langText: { fontSize: 13, color: colors.textSecondary },
  langTextActive: { color: colors.accentPrimary, fontWeight: '600' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentPrimary },
  hint: { fontSize: 10, color: colors.textMuted, marginTop: 8 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  aboutLabel: { fontSize: 12, color: colors.textMuted },
  aboutValue: { fontSize: 12, color: colors.textPrimary, fontWeight: '500' },
});
