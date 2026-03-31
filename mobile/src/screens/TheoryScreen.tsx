import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, glassCard, gradientColors } from '../theme/colors';
import api from '../config/api';

// ----- Types -----

interface TheoryModule {
  title: string;
  content?: string;
}

interface TheorySession {
  id: number;
  title: string;
  description: string;
  modules: TheoryModule[] | string;
  duration: number;
  status: string;
}

interface TheoryProgress {
  completedModules: number[] | string;
  completed: boolean;
}

interface SessionWithProgress extends TheorySession {
  progress: TheoryProgress | null;
}

// ----- Helpers -----

function parseModules(modules: TheoryModule[] | string): TheoryModule[] {
  if (typeof modules === 'string') {
    try {
      return JSON.parse(modules);
    } catch {
      return [];
    }
  }
  return modules || [];
}

function parseCompletedModules(completed: number[] | string): number[] {
  if (typeof completed === 'string') {
    try {
      return JSON.parse(completed);
    } catch {
      return [];
    }
  }
  return completed || [];
}

// ----- List Mode -----

function SessionList({
  onSelect,
  onBack,
}: {
  onSelect: (session: SessionWithProgress) => void;
  onBack: () => void;
}) {
  const [sessions, setSessions] = useState<SessionWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/theory-sessions', {
        params: { status: 'published', limit: 50 },
      });
      const rawSessions: TheorySession[] = response.data.data || [];

      // Fetch progress for each session
      const withProgress: SessionWithProgress[] = await Promise.all(
        rawSessions.map(async (session) => {
          try {
            const progRes = await api.get(
              `/theory-sessions/${session.id}/progress`
            );
            return { ...session, progress: progRes.data.data || null };
          } catch {
            return { ...session, progress: null };
          }
        })
      );

      setSessions(withProgress);
    } catch {
      setError('Failed to load theory sessions. Tap to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchSessions}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.listContent}
    >
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.screenTitle}>
          Theory<Text style={{ color: colors.accentPrimary }}>.</Text>
        </Text>
        <Text style={styles.screenSubtitle}>Learn at your own pace</Text>
      </View>

      {/* Session cards */}
      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>No theory sessions available yet.</Text>
        </View>
      ) : (
        sessions.map((session) => {
          const modules = parseModules(session.modules);
          const moduleCount = modules.length;
          const completedModules = session.progress
            ? parseCompletedModules(session.progress.completedModules)
            : [];
          const completedCount = completedModules.length;
          const progressPercent =
            moduleCount > 0 ? (completedCount / moduleCount) * 100 : 0;
          const isComplete = session.progress?.completed || progressPercent >= 100;

          let progressLabel: string;
          let progressColor: string;
          if (isComplete) {
            progressLabel = 'Done';
            progressColor = colors.accentGreen;
          } else if (completedCount > 0) {
            progressLabel = `${Math.round(progressPercent)}%`;
            progressColor = colors.accentPrimary;
          } else {
            progressLabel = 'Start';
            progressColor = colors.textMuted;
          }

          return (
            <TouchableOpacity
              key={session.id}
              style={[styles.sessionCard, glassCard]}
              onPress={() => onSelect(session)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.cardIconWrap,
                    {
                      backgroundColor: isComplete
                        ? colors.accentGreen + '15'
                        : colors.accentPrimary + '15',
                    },
                  ]}
                >
                  <Ionicons
                    name={isComplete ? 'checkmark-circle' : 'book-outline'}
                    size={20}
                    color={isComplete ? colors.accentGreen : colors.accentPrimary}
                  />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{session.title}</Text>
                  <Text style={styles.cardMeta}>
                    {moduleCount} module{moduleCount !== 1 ? 's' : ''} ·{' '}
                    {session.duration} min
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  {progressPercent > 0 ? (
                    <LinearGradient
                      colors={
                        isComplete
                          ? [colors.accentGreen, colors.accentGreen]
                          : gradientColors
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(progressPercent, 100)}%` },
                      ]}
                    />
                  ) : null}
                </View>
                <Text style={[styles.progressLabel, { color: progressColor }]}>
                  {progressLabel}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

// ----- Detail Mode -----

function SessionDetail({
  session,
  onBack,
  onProgressUpdate,
}: {
  session: SessionWithProgress;
  onBack: () => void;
  onProgressUpdate: (updated: SessionWithProgress) => void;
}) {
  const modules = parseModules(session.modules);
  const initialCompleted = session.progress
    ? parseCompletedModules(session.progress.completedModules)
    : [];

  const [completedModules, setCompletedModules] = useState<number[]>(initialCompleted);
  const [saving, setSaving] = useState(false);
  const checkAnims = useRef(
    modules.map(() => new Animated.Value(initialCompleted.length > 0 ? 0 : 0))
  ).current;

  // Animate checkmark when toggled
  const animateCheck = (index: number, isChecking: boolean) => {
    Animated.spring(checkAnims[index], {
      toValue: isChecking ? 1 : 0,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const toggleModule = async (index: number) => {
    const isCompleted = completedModules.includes(index);
    let newCompleted: number[];

    if (isCompleted) {
      newCompleted = completedModules.filter((i) => i !== index);
      animateCheck(index, false);
    } else {
      newCompleted = [...completedModules, index];
      animateCheck(index, true);
    }

    setCompletedModules(newCompleted);
    const allDone = newCompleted.length === modules.length;

    setSaving(true);
    try {
      await api.post(`/theory-sessions/${session.id}/progress`, {
        completedModules: newCompleted,
        completed: allDone,
      });
      // Notify parent of updated progress
      onProgressUpdate({
        ...session,
        progress: {
          completedModules: newCompleted,
          completed: allDone,
        },
      });
    } catch {
      // Revert on error
      setCompletedModules(isCompleted ? [...completedModules] : completedModules.filter((i) => i !== index));
      Alert.alert('Error', 'Failed to save progress. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const completedCount = completedModules.length;
  const totalModules = modules.length;
  const progressPercent = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;
  const allDone = completedCount === totalModules && totalModules > 0;

  return (
    <View style={styles.detailContainer}>
      {/* Top bar */}
      <View style={styles.detailTopBar}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.detailTopTitle} numberOfLines={1}>
          {session.title}
        </Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Progress summary */}
      <View style={styles.detailProgressSection}>
        <View style={styles.progressSummaryRow}>
          <Text style={styles.progressSummaryText}>
            {completedCount}/{totalModules} modules completed
          </Text>
          {saving && (
            <ActivityIndicator
              size="small"
              color={colors.accentPrimary}
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
        <View style={styles.detailProgressTrack}>
          {progressPercent > 0 ? (
            <LinearGradient
              colors={
                allDone
                  ? [colors.accentGreen, colors.accentGreen]
                  : gradientColors
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.detailProgressFill,
                { width: `${Math.min(progressPercent, 100)}%` },
              ]}
            />
          ) : null}
        </View>
      </View>

      {/* Description */}
      <View style={styles.descriptionSection}>
        <Text style={styles.descriptionText}>{session.description}</Text>
      </View>

      {/* Module list */}
      <ScrollView
        style={styles.moduleList}
        contentContainerStyle={styles.moduleListContent}
      >
        {modules.map((mod, index) => {
          const isChecked = completedModules.includes(index);
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.moduleCard,
                glassCard,
                isChecked && styles.moduleCardCompleted,
              ]}
              onPress={() => toggleModule(index)}
              activeOpacity={0.7}
              disabled={saving}
            >
              <View
                style={[
                  styles.checkbox,
                  isChecked && styles.checkboxChecked,
                ]}
              >
                {isChecked && (
                  <Ionicons name="checkmark" size={14} color={colors.ctaText} />
                )}
              </View>
              <View style={styles.moduleInfo}>
                <Text
                  style={[
                    styles.moduleTitle,
                    isChecked && styles.moduleTitleCompleted,
                  ]}
                >
                  {mod.title}
                </Text>
                <Text style={styles.moduleIndex}>
                  Module {index + 1} of {totalModules}
                </Text>
              </View>
              <Ionicons
                name={isChecked ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={isChecked ? colors.accentGreen : colors.textMuted}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Completion banner */}
      {allDone && (
        <View style={styles.completionBanner}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.completionGradient}
          >
            <Ionicons name="trophy" size={18} color={colors.ctaText} />
            <Text style={styles.completionText}>
              All modules completed!
            </Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

// ----- Main Screen -----

export default function TheoryScreen({ navigation }: { navigation: any }) {
  const [activeSession, setActiveSession] = useState<SessionWithProgress | null>(
    null
  );

  const handleSelect = (session: SessionWithProgress) => {
    setActiveSession(session);
  };

  const handleBack = () => {
    setActiveSession(null);
  };

  const handleBrowseBack = () => {
    navigation.goBack();
  };

  const handleProgressUpdate = (updated: SessionWithProgress) => {
    setActiveSession(updated);
  };

  if (activeSession) {
    return (
      <SessionDetail
        session={activeSession}
        onBack={handleBack}
        onProgressUpdate={handleProgressUpdate}
      />
    );
  }

  return <SessionList onSelect={handleSelect} onBack={handleBrowseBack} />;
}

// ----- Styles -----

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
  retryText: {
    color: colors.accentPrimary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },

  // Back button
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  // Header
  headerSection: {
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Session cards
  sessionCard: {
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 10,
    color: colors.textMuted,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.progressBg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '500',
    width: 36,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 12,
  },

  // ----- Detail Mode -----
  detailContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingTop: 60,
  },
  detailTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  detailTopTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },

  // Detail progress
  detailProgressSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressSummaryText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  detailProgressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.progressBg,
    overflow: 'hidden',
  },
  detailProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Description
  descriptionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },

  // Module list
  moduleList: {
    flex: 1,
  },
  moduleListContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 10,
  },
  moduleCardCompleted: {
    backgroundColor: colors.pillActiveBg,
    borderColor: colors.pillActiveBorder,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxChecked: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimary,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  moduleTitleCompleted: {
    color: colors.textSecondary,
  },
  moduleIndex: {
    fontSize: 10,
    color: colors.textMuted,
  },

  // Completion banner
  completionBanner: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 8,
  },
  completionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  completionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ctaText,
    letterSpacing: 0.3,
  },
});
