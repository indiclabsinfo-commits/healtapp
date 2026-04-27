import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, glassCard, gradientColors } from '../theme/colors';
import api from '../config/api';

const { width } = Dimensions.get('window');
const BAR_MAX_HEIGHT = 80;
const CHART_WIDTH = width - 40 - 32; // page padding + card padding

interface AnalyticsData {
  totalAssessments: number;
  averageScore: number;
  currentStreak: number;
  totalSessions: number;
  weeklyMoods: number[];
  categoryScores: { category: string; score: number }[];
  recentAssessments: { score: number; completedAt: string; title?: string }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Anxiety: colors.accentPrimary,
  Stress: colors.accentRed,
  Depression: colors.accentPurple,
  'Self-esteem': colors.accentYellow,
  Wellbeing: colors.accentGreen,
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AnalyticsScreen() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [analyticsRes, moodRes] = await Promise.allSettled([
        api.get('/analytics/user'),
        api.get('/mood/history', {
          params: {
            startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
            endDate: new Date().toISOString(),
          },
        }),
      ]);

      const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value.data.data || {} : {};
      const moods = moodRes.status === 'fulfilled' ? moodRes.value.data.data || [] : [];

      // Build 7-day mood array (index 0 = Monday)
      const weeklyMoods: number[] = Array(7).fill(0);
      moods.forEach((m: any) => {
        const d = new Date(m.date);
        const dow = (d.getDay() + 6) % 7; // Mon=0
        weeklyMoods[dow] = m.mood;
      });

      setData({
        totalAssessments: analytics.totalAssessments || 0,
        averageScore: analytics.averageScore || 0,
        currentStreak: analytics.currentStreak || 0,
        totalSessions: analytics.totalSessions || 0,
        weeklyMoods,
        categoryScores: analytics.categoryScores || [],
        recentAssessments: analytics.recentAssessments || [],
      });
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentPrimary} />
      </View>
    );
  }

  const maxMood = Math.max(...(data?.weeklyMoods || [1]), 1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentPrimary} />}
    >
      {/* Header */}
      <Text style={styles.pageTitle}>Analytics.</Text>
      <Text style={styles.pageSub}>Your wellness journey</Text>

      {/* KPI Grid */}
      <View style={styles.kpiGrid}>
        {[
          { label: 'Assessments', value: data?.totalAssessments ?? 0, icon: 'clipboard-outline', color: colors.accentPrimary },
          { label: 'Avg Score', value: `${Math.round(data?.averageScore ?? 0)}%`, icon: 'trending-up-outline', color: colors.accentGreen },
          { label: 'Sessions', value: data?.totalSessions ?? 0, icon: 'people-outline', color: colors.accentPurple },
          { label: 'Day Streak', value: data?.currentStreak ?? 0, icon: 'flame-outline', color: colors.accentYellow },
        ].map((kpi) => (
          <View key={kpi.label} style={[glassCard, styles.kpiCard]}>
            <Ionicons name={kpi.icon as any} size={18} color={kpi.color} style={{ marginBottom: 8 }} />
            <Text style={[styles.kpiValue, { color: kpi.color }]}>{kpi.value}</Text>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
          </View>
        ))}
      </View>

      {/* Mood Trend */}
      <View style={[glassCard, styles.section]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Wellness Trend</Text>
          <Text style={styles.sectionTag}>Last 7 days</Text>
        </View>
        <View style={styles.barChart}>
          {(data?.weeklyMoods || Array(7).fill(0)).map((mood, i) => {
            const barH = mood > 0 ? (mood / 5) * BAR_MAX_HEIGHT : 4;
            return (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <LinearGradient
                    colors={['transparent', colors.accentPrimary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[styles.bar, { height: barH }]}
                  />
                </View>
                <Text style={styles.barLabel}>{DAY_LABELS[i]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Category Scores */}
      {data?.categoryScores && data.categoryScores.length > 0 && (
        <View style={[glassCard, styles.section]}>
          <Text style={styles.sectionTitle}>Category Scores</Text>
          <View style={{ gap: 14, marginTop: 12 }}>
            {data.categoryScores.map((cat) => {
              const color = CATEGORY_COLORS[cat.category] || colors.accentSecondary;
              return (
                <View key={cat.category}>
                  <View style={styles.catHeader}>
                    <Text style={styles.catLabel}>{cat.category}</Text>
                    <Text style={[styles.catPct, { color }]}>{Math.round(cat.score)}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${cat.score}%` as any, backgroundColor: color }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Recent Assessments */}
      {data?.recentAssessments && data.recentAssessments.length > 0 && (
        <View style={[glassCard, styles.section]}>
          <Text style={styles.sectionTitle}>Recent Assessments</Text>
          <View style={{ gap: 10, marginTop: 12 }}>
            {data.recentAssessments.slice(0, 5).map((a, i) => (
              <View key={i} style={styles.assessRow}>
                <View style={styles.assessLeft}>
                  <Text style={styles.assessTitle}>{a.title || 'Assessment'}</Text>
                  <Text style={styles.assessDate}>
                    {new Date(a.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: a.score >= 70 ? 'rgba(74,222,128,0.12)' : a.score >= 40 ? 'rgba(255,211,61,0.12)' : 'rgba(255,107,107,0.12)' }]}>
                  <Text style={[styles.scoreText, { color: a.score >= 70 ? colors.accentGreen : a.score >= 40 ? colors.accentYellow : colors.accentRed }]}>
                    {Math.round(a.score)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Empty state */}
      {(!data || (data.totalAssessments === 0 && data.totalSessions === 0)) && (
        <View style={styles.emptyBox}>
          <Ionicons name="bar-chart-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptyText}>Complete an assessment or log your mood to see analytics</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 100 },
  centered: { flex: 1, backgroundColor: colors.bgPrimary, alignItems: 'center', justifyContent: 'center' },

  pageTitle: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  pageSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 20, marginTop: 4 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  kpiCard: { flex: 1, minWidth: '45%', padding: 16, alignItems: 'center' },
  kpiValue: { fontSize: 26, fontWeight: '700', marginBottom: 2 },
  kpiLabel: { fontSize: 10, color: colors.textMuted, letterSpacing: 0.5, textAlign: 'center' },

  section: { padding: 18, marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  sectionTag: { fontSize: 10, color: colors.accentPrimary, fontWeight: '500' },

  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: BAR_MAX_HEIGHT + 24 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { width: 20, height: BAR_MAX_HEIGHT, justifyContent: 'flex-end', borderRadius: 6, overflow: 'hidden', backgroundColor: colors.progressBg },
  bar: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 9, color: colors.textMuted },

  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catLabel: { fontSize: 13, color: colors.textSecondary },
  catPct: { fontSize: 13, fontWeight: '600' },
  progressTrack: { height: 3, backgroundColor: colors.progressBg, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  assessRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  assessLeft: { flex: 1 },
  assessTitle: { fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
  assessDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  scoreText: { fontSize: 12, fontWeight: '600' },

  emptyBox: { alignItems: 'center', marginTop: 40, gap: 12, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
