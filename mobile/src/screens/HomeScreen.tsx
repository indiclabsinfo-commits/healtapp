import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, glassCard, gradientColors } from '../theme/colors';
import { useAuthStore } from '../store/auth';
import api from '../config/api';

type Props = {
  navigation: any;
};

const MOOD_EMOJIS = [
  { emoji: '😊', label: 'Great', value: 5 },
  { emoji: '🙂', label: 'Good', value: 4 },
  { emoji: '😐', label: 'Okay', value: 3 },
  { emoji: '😔', label: 'Low', value: 2 },
  { emoji: '😢', label: 'Bad', value: 1 },
];

interface QuickAction {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}

interface Assignment {
  id: number;
  title: string;
  type: string;
  deadline: string;
  mandatory: boolean;
}

export default function HomeScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const memberships = useAuthStore((s) => s.memberships);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [moodLoading, setMoodLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyMoods, setWeeklyMoods] = useState<number[]>([]);
  const [moodsLoading, setMoodsLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Primary membership (first org)
  const primaryMembership = memberships.length > 0 ? memberships[0] : null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'User';

  const fetchWeeklyMoods = useCallback(async () => {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const response = await api.get('/mood/history', {
        params: {
          startDate: weekAgo.toISOString(),
          endDate: now.toISOString(),
        },
      });
      const moods = response.data.data || [];
      const days: number[] = [];
      const now2 = new Date();
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now2.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = day.toISOString().split('T')[0];
        const entry = moods.find(
          (m: any) => m.date?.startsWith(dayStr) || m.createdAt?.startsWith(dayStr)
        );
        days.push(entry ? entry.mood : 0);
      }
      setWeeklyMoods(days);
    } catch {
      setWeeklyMoods([0, 0, 0, 0, 0, 0, 0]);
    } finally {
      setMoodsLoading(false);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    if (!primaryMembership) return;
    setAssignmentsLoading(true);
    try {
      const response = await api.get('/assignments/my', {
        params: { orgId: primaryMembership.organization.id },
      });
      setAssignments(response.data.data || []);
    } catch {
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [primaryMembership]);

  useEffect(() => {
    fetchWeeklyMoods();
    fetchAssignments();
  }, [fetchWeeklyMoods, fetchAssignments]);

  const handleMoodSelect = async (value: number) => {
    setSelectedMood(value);
    setMoodLoading(true);
    try {
      await api.post('/mood', { mood: value });
      fetchWeeklyMoods();
    } catch {
      // Silently fail
    } finally {
      setMoodLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWeeklyMoods(), fetchAssignments()]);
    setRefreshing(false);
  };

  const quickActions: QuickAction[] = [
    {
      icon: 'clipboard-outline',
      title: 'Assessment',
      subtitle: 'Take a test',
      color: colors.accentPrimary,
      onPress: () => navigation.navigate('Assessment'),
    },
    {
      icon: 'people-outline',
      title: 'Counsellors',
      subtitle: 'Find experts',
      color: colors.accentPurple,
      onPress: () => navigation.navigate('Explore'),
    },
    {
      icon: 'leaf-outline',
      title: 'Breathing',
      subtitle: 'Relax & breathe',
      color: colors.accentGreen,
      onPress: () => navigation.navigate('Breathe'),
    },
    {
      icon: 'book-outline',
      title: 'Theory',
      subtitle: 'Learn more',
      color: colors.accentYellow,
      onPress: () => navigation.navigate('Theory'),
    },
  ];

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const formatDeadline = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const getTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'assessment':
        return colors.accentPrimary;
      case 'workshop':
        return colors.accentPurple;
      case 'theory':
        return colors.accentYellow;
      default:
        return colors.accentSecondary;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accentPrimary}
        />
      }
    >
      {/* Greeting */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingLabel}>{getGreeting()}</Text>
        <Text style={styles.greetingName}>{firstName} ✨</Text>
      </View>

      {/* Organization Banner */}
      {primaryMembership && (
        <View style={[styles.orgBanner, glassCard]}>
          <View style={styles.orgRow}>
            <View style={styles.orgIconCircle}>
              <Text style={styles.orgIconEmoji}>
                {primaryMembership.organization.type === 'school' ? '🏫' : '🏢'}
              </Text>
            </View>
            <View style={styles.orgInfo}>
              <Text style={styles.orgName}>
                {primaryMembership.organization.name}
              </Text>
              <Text style={styles.orgDetail}>
                {primaryMembership.class
                  ? `Class: ${primaryMembership.class}`
                  : primaryMembership.department
                  ? `Dept: ${primaryMembership.department}`
                  : primaryMembership.role}
              </Text>
            </View>
            <View style={styles.creditBadge}>
              <Ionicons name="wallet-outline" size={14} color={colors.accentPrimary} />
              <Text style={styles.creditCount}>
                {primaryMembership.creditBalance}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Assigned Tasks */}
      {primaryMembership && (
        <View style={styles.assignedSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assigned Tasks</Text>
            {assignmentsLoading && (
              <ActivityIndicator size="small" color={colors.accentPrimary} />
            )}
          </View>

          {!assignmentsLoading && assignments.length === 0 ? (
            <View style={[styles.emptyAssignCard, glassCard]}>
              <Ionicons name="checkmark-done-outline" size={20} color={colors.textMuted} />
              <Text style={styles.emptyAssignText}>No pending tasks</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.assignCardsRow}
            >
              {assignments.map((task) => {
                const typeColor = getTypeColor(task.type);
                return (
                  <View
                    key={task.id}
                    style={[styles.assignCard, glassCard]}
                  >
                    <View style={styles.assignCardTop}>
                      <View
                        style={[
                          styles.typeTag,
                          { backgroundColor: typeColor + '15' },
                        ]}
                      >
                        <Text style={[styles.typeTagText, { color: typeColor }]}>
                          {task.type}
                        </Text>
                      </View>
                      {task.mandatory && (
                        <View style={styles.mandatoryBadge}>
                          <Text style={styles.mandatoryText}>Required</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.assignTitle} numberOfLines={2}>
                      {task.title}
                    </Text>
                    <Text style={styles.assignDeadline}>
                      {formatDeadline(task.deadline)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* Mood Check-in */}
      <View style={[styles.moodCard, glassCard]}>
        <Text style={styles.moodLabel}>How are you feeling today?</Text>
        <View style={styles.moodRow}>
          {MOOD_EMOJIS.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.moodButton,
                selectedMood === item.value && styles.moodButtonActive,
              ]}
              onPress={() => handleMoodSelect(item.value)}
              disabled={moodLoading}
            >
              <Text style={styles.moodEmoji}>{item.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.title}
            style={[styles.quickCard, glassCard]}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.quickIconContainer,
                { backgroundColor: action.color + '15' },
              ]}
            >
              <Ionicons name={action.icon} size={20} color={action.color} />
            </View>
            <Text style={styles.quickTitle}>{action.title}</Text>
            <Text style={styles.quickSubtitle}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Weekly Mood Trend */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Weekly Mood</Text>
        <Text style={styles.sectionTag}>Last 7 days</Text>
      </View>

      <View style={[styles.trendCard, glassCard]}>
        {moodsLoading ? (
          <ActivityIndicator color={colors.accentPrimary} style={{ padding: 20 }} />
        ) : (
          <View style={styles.barChart}>
            {weeklyMoods.map((mood, index) => {
              const height = mood > 0 ? (mood / 5) * 80 : 4;
              return (
                <View key={index} style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    {mood > 0 ? (
                      <LinearGradient
                        colors={[gradientColors[0] + '20', gradientColors[0]]}
                        style={[styles.bar, { height }]}
                      />
                    ) : (
                      <View style={[styles.barEmpty, { height }]} />
                    )}
                  </View>
                  <Text style={styles.barLabel}>{DAY_LABELS[index]}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  greetingSection: {
    marginBottom: 24,
  },
  greetingLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Organization Banner
  orgBanner: {
    padding: 16,
    marginBottom: 20,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orgIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(111,255,233,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgIconEmoji: {
    fontSize: 20,
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  orgDetail: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(111,255,233,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.tagBorder,
  },
  creditCount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accentPrimary,
  },

  // Assigned Tasks
  assignedSection: {
    marginBottom: 20,
  },
  assignCardsRow: {
    gap: 12,
    paddingRight: 4,
  },
  assignCard: {
    width: 180,
    padding: 14,
  },
  assignCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  typeTagText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  mandatoryBadge: {
    backgroundColor: 'rgba(255,107,107,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 100,
  },
  mandatoryText: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.accentRed,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  assignTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
    lineHeight: 18,
  },
  assignDeadline: {
    fontSize: 10,
    color: colors.textMuted,
  },
  emptyAssignCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  emptyAssignText: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Mood
  moodCard: {
    padding: 18,
    marginBottom: 20,
  },
  moodLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
  },
  moodButtonActive: {
    backgroundColor: colors.pillActiveBg,
    borderWidth: 1,
    borderColor: colors.pillActiveBorder,
  },
  moodEmoji: {
    fontSize: 22,
  },

  // Quick Actions
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  quickCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    padding: 16,
  },
  quickIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  quickSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionTag: {
    fontSize: 10,
    color: colors.textMuted,
    backgroundColor: colors.tagBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.tagBorder,
    overflow: 'hidden',
  },

  // Trend chart
  trendCard: {
    padding: 18,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 110,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  bar: {
    width: 20,
    borderRadius: 6,
    minHeight: 4,
  },
  barEmpty: {
    width: 20,
    borderRadius: 6,
    backgroundColor: colors.progressBg,
  },
  barLabel: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 8,
    letterSpacing: 0.5,
  },
});
