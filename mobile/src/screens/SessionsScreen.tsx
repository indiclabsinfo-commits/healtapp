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
import { colors, glassCard } from '../theme/colors';
import api from '../config/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface Session {
  id: number;
  counsellorId: number;
  counsellor?: {
    id: number;
    name: string;
    specialization: string;
  };
  counsellorName?: string;
  date: string;
  time: string;
  duration: number;
  status: 'BOOKED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

type TabType = 'upcoming' | 'past';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  BOOKED: {
    color: colors.accentPrimary,
    bg: 'rgba(111,255,233,0.1)',
    label: 'Booked',
  },
  COMPLETED: {
    color: colors.accentGreen,
    bg: 'rgba(74,222,128,0.1)',
    label: 'Completed',
  },
  CANCELLED: {
    color: colors.accentRed,
    bg: 'rgba(255,107,107,0.1)',
    label: 'Cancelled',
  },
};

export default function SessionsScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await api.get('/consultations/my', {
        params: { limit: 50 },
      });
      setSessions(response.data.data || []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  };

  const now = new Date();

  const filteredSessions = sessions.filter((session) => {
    const sessionDate = new Date(session.date);
    if (activeTab === 'upcoming') {
      return (
        sessionDate >= now ||
        (session.status === 'BOOKED' && sessionDate.toDateString() === now.toDateString())
      );
    }
    return sessionDate < now || session.status === 'COMPLETED' || session.status === 'CANCELLED';
  });

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getDayName = (dateStr: string): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(dateStr).getDay()];
  };

  const renderSessionCard = (session: Session) => {
    const statusConf = STATUS_CONFIG[session.status] || STATUS_CONFIG.BOOKED;
    const counsellorName =
      session.counsellor?.name || session.counsellorName || 'Counsellor';
    const isSelected = selectedSession?.id === session.id;

    return (
      <TouchableOpacity
        key={session.id}
        style={[styles.sessionCard, glassCard]}
        onPress={() => setSelectedSession(isSelected ? null : session)}
        activeOpacity={0.7}
      >
        {/* Top row */}
        <View style={styles.cardTopRow}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateBlockDay}>
              {new Date(session.date).getDate()}
            </Text>
            <Text style={styles.dateBlockMonth}>
              {new Date(session.date).toLocaleString('en', { month: 'short' }).toUpperCase()}
            </Text>
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.cardCounsellor}>{counsellorName}</Text>
            <Text style={styles.cardDateTime}>
              {getDayName(session.date)} at {session.time}
            </Text>
            {session.counsellor?.specialization && (
              <Text style={styles.cardSpec}>
                {session.counsellor.specialization}
              </Text>
            )}
          </View>

          <View
            style={[
              styles.statusTag,
              { backgroundColor: statusConf.bg },
            ]}
          >
            <Text style={[styles.statusText, { color: statusConf.color }]}>
              {statusConf.label}
            </Text>
          </View>
        </View>

        {/* Expanded details */}
        {isSelected && (
          <View style={styles.expandedDetails}>
            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.detailText}>
                Duration: {session.duration || 60} minutes
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={14} color={colors.textMuted} />
              <Text style={styles.detailText}>
                Booking ID: #{session.id}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text style={styles.detailText}>
                Booked on: {formatDate(session.createdAt)}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Sessions</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'upcoming' && styles.tabTextActive,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'past' && styles.tabTextActive,
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Session list */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentPrimary}
          />
        }
      >
        {loading ? (
          <ActivityIndicator
            color={colors.accentPrimary}
            style={{ marginTop: 60 }}
          />
        ) : filteredSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name={activeTab === 'upcoming' ? 'calendar-outline' : 'checkmark-done-outline'}
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'upcoming'
                ? 'No upcoming sessions'
                : 'No past sessions'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'upcoming'
                ? 'Book a session with a counsellor to get started'
                : 'Your completed sessions will appear here'}
            </Text>
          </View>
        ) : (
          <View style={styles.sessionList}>
            {filteredSessions.map(renderSessionCard)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderCard,
  },
  tabActive: {
    backgroundColor: colors.pillActiveBg,
    borderColor: colors.pillActiveBorder,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.accentPrimary,
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sessionList: {
    gap: 12,
  },

  // Session card
  sessionCard: {
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dateBlock: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(111,255,233,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBlockDay: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accentPrimary,
    lineHeight: 20,
  },
  dateBlockMonth: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.accentPrimary,
    letterSpacing: 0.5,
  },
  cardInfo: {
    flex: 1,
  },
  cardCounsellor: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardDateTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  cardSpec: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Expanded details
  expandedDetails: {
    marginTop: 4,
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.borderCard,
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
});
