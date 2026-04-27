import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, glassCard } from '../theme/colors';
import api from '../config/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

interface Assessment {
  id: number;
  score: number;
  completedAt: string;
  questionnaire?: { title: string };
}

export default function AssessmentHistoryScreen({ navigation }: Props) {
  const [items, setItems] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/assessments/my', { params: { limit: 50 } });
      setItems(response.data?.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function levelFor(score: number) {
    if (score < 20) return { label: 'Minimal', color: '#4ADE80' };
    if (score < 45) return { label: 'Mild', color: '#FFD93D' };
    if (score < 70) return { label: 'Moderate', color: '#FF9F40' };
    return { label: 'Severe', color: '#FF6B6B' };
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={styles.title}>Assessment History</Text>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.accentPrimary} /></View>
        ) : error ? (
          <View style={[glassCard, styles.empty]}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchHistory}><Text style={styles.retry}>Retry</Text></TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View style={[glassCard, styles.empty]}>
            <Ionicons name="clipboard-outline" size={36} color={colors.accentPrimary} />
            <Text style={styles.emptyTitle}>No past assessments</Text>
            <Text style={styles.emptyHint}>Take an assessment to start tracking your wellness journey.</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {items.map((a) => {
              const lvl = levelFor(a.score);
              return (
                <View key={a.id} style={[glassCard, styles.row]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{a.questionnaire?.title || `Assessment #${a.id}`}</Text>
                    <Text style={styles.rowMeta}>{formatDate(a.completedAt)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.score, { color: lvl.color }]}>{Math.round(a.score)}%</Text>
                    <Text style={[styles.level, { color: lvl.color }]}>{lvl.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
  center: { alignItems: 'center', paddingVertical: 60 },
  empty: { padding: 32, borderRadius: 16, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  emptyHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  errorText: { fontSize: 13, color: '#FF6B6B' },
  retry: { fontSize: 12, color: colors.accentPrimary, fontWeight: '600' },
  row: { padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  rowMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  score: { fontSize: 22, fontWeight: '700' },
  level: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
});
