import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, glassCard, gradientColors } from '../theme/colors';
import api from '../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = SCREEN_WIDTH * 0.55;

// ----- Types -----

interface BreathingExercise {
  id: number;
  name: string;
  description: string;
  inhaleSeconds: number;
  holdSeconds: number;
  exhaleSeconds: number;
  holdAfterExhale: number;
  defaultCycles: number;
  category: string | null;
}

type Phase = 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale';

// ----- Browse Mode: Exercise List -----

function ExerciseList({
  onStart,
}: {
  onStart: (exercise: BreathingExercise) => void;
}) {
  const [exercises, setExercises] = useState<BreathingExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { limit: 50 };
      if (selectedCategory) params.category = selectedCategory;
      const response = await api.get('/breathing-exercises', { params });
      setExercises(response.data.data || []);
    } catch {
      setError('Failed to load exercises. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  // Derive unique categories from exercises
  const categories = Array.from(
    new Set(exercises.map((e) => e.category).filter(Boolean))
  ) as string[];

  const formatTiming = (ex: BreathingExercise) => {
    const parts = [`${ex.inhaleSeconds}s in`];
    if (ex.holdSeconds > 0) parts.push(`${ex.holdSeconds}s hold`);
    parts.push(`${ex.exhaleSeconds}s out`);
    if (ex.holdAfterExhale > 0) parts.push(`${ex.holdAfterExhale}s hold`);
    return parts.join(' / ');
  };

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
        <TouchableOpacity onPress={fetchExercises}>
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
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.screenTitle}>Breathe.</Text>
        <Text style={styles.screenSubtitle}>Find your calm</Text>
      </View>

      {/* Category pills */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          <TouchableOpacity
            style={[
              styles.pill,
              !selectedCategory && styles.pillActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.pillText,
                !selectedCategory && styles.pillTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.pill,
                selectedCategory === cat && styles.pillActive,
              ]}
              onPress={() =>
                setSelectedCategory(selectedCategory === cat ? null : cat)
              }
            >
              <Text
                style={[
                  styles.pillText,
                  selectedCategory === cat && styles.pillTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Exercise cards */}
      {exercises.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="leaf-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>No exercises available yet.</Text>
        </View>
      ) : (
        exercises.map((exercise) => (
          <View key={exercise.id} style={[styles.exerciseCard, glassCard]}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseIconWrap}>
                <Ionicons name="leaf-outline" size={20} color={colors.accentPrimary} />
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseTiming}>
                  {formatTiming(exercise)}
                </Text>
              </View>
            </View>

            {exercise.category && (
              <View style={styles.tagRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{exercise.category}</Text>
                </View>
                <Text style={styles.cycleText}>
                  {exercise.defaultCycles} cycles
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => onStart(exercise)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.startButton}
              >
                <Text style={styles.startButtonText}>Start</Text>
                <Ionicons name="play" size={14} color={colors.ctaText} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ----- Exercise Mode: Animated Breathing -----

function ExerciseMode({
  exercise,
  onComplete,
  onBack,
}: {
  exercise: BreathingExercise;
  onComplete: (cycles: number, durationSec: number) => void;
  onBack: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('inhale');
  const [phaseCountdown, setPhaseCountdown] = useState(exercise.inhaleSeconds);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [totalCycles] = useState(exercise.defaultCycles || 4);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  const phaseRef = useRef(phase);
  const countdownRef = useRef(phaseCountdown);
  const cycleRef = useRef(currentCycle);
  const pausedRef = useRef(isPaused);
  const finishedRef = useRef(isFinished);

  // Keep refs in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { countdownRef.current = phaseCountdown; }, [phaseCountdown]);
  useEffect(() => { cycleRef.current = currentCycle; }, [currentCycle]);
  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { finishedRef.current = isFinished; }, [isFinished]);

  // Animate circle based on phase
  useEffect(() => {
    if (isPaused || isFinished) return;

    const getDuration = () => {
      switch (phase) {
        case 'inhale': return exercise.inhaleSeconds * 1000;
        case 'hold': return exercise.holdSeconds * 1000;
        case 'exhale': return exercise.exhaleSeconds * 1000;
        case 'holdAfterExhale': return exercise.holdAfterExhale * 1000;
      }
    };

    const getTargetScale = () => {
      switch (phase) {
        case 'inhale': return 1.0;
        case 'hold': return 1.0;
        case 'exhale': return 0.5;
        case 'holdAfterExhale': return 0.5;
      }
    };

    const getTargetOpacity = () => {
      switch (phase) {
        case 'inhale': return 0.8;
        case 'hold': return 0.8;
        case 'exhale': return 0.3;
        case 'holdAfterExhale': return 0.3;
      }
    };

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: getTargetScale(),
        duration: getDuration(),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: getTargetOpacity(),
        duration: getDuration(),
        useNativeDriver: true,
      }),
    ]).start();
  }, [phase, isPaused, isFinished, exercise, scaleAnim, opacityAnim]);

  // Countdown timer
  useEffect(() => {
    if (isPaused || isFinished) return;

    const interval = setInterval(() => {
      if (pausedRef.current || finishedRef.current) return;

      setElapsedSec((s) => s + 1);

      if (countdownRef.current > 1) {
        setPhaseCountdown((c) => c - 1);
      } else {
        // Move to next phase
        const nextPhase = getNextPhase(phaseRef.current);
        if (nextPhase === 'inhale') {
          // Completed one cycle
          if (cycleRef.current >= totalCycles) {
            setIsFinished(true);
            clearInterval(interval);
            return;
          }
          setCurrentCycle((c) => c + 1);
        }
        setPhase(nextPhase);
        setPhaseCountdown(getPhaseDuration(nextPhase));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isFinished, totalCycles, exercise]);

  const getNextPhase = (current: Phase): Phase => {
    switch (current) {
      case 'inhale':
        return exercise.holdSeconds > 0 ? 'hold' : 'exhale';
      case 'hold':
        return 'exhale';
      case 'exhale':
        return exercise.holdAfterExhale > 0 ? 'holdAfterExhale' : 'inhale';
      case 'holdAfterExhale':
        return 'inhale';
    }
  };

  const getPhaseDuration = (p: Phase): number => {
    switch (p) {
      case 'inhale': return exercise.inhaleSeconds;
      case 'hold': return exercise.holdSeconds;
      case 'exhale': return exercise.exhaleSeconds;
      case 'holdAfterExhale': return exercise.holdAfterExhale;
    }
  };

  const getPhaseLabel = (): string => {
    switch (phase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'holdAfterExhale': return 'Hold';
    }
  };

  const handleFinish = () => {
    onComplete(currentCycle, elapsedSec);
  };

  const progress = currentCycle / totalCycles;

  if (isFinished) {
    return (
      <View style={styles.exerciseModeContainer}>
        <View style={styles.finishedContent}>
          <View style={styles.finishedIcon}>
            <Ionicons name="checkmark-circle" size={64} color={colors.accentGreen} />
          </View>
          <Text style={styles.finishedTitle}>Well Done!</Text>
          <Text style={styles.finishedSubtitle}>
            {totalCycles} cycles completed in {Math.floor(elapsedSec / 60)}:
            {String(elapsedSec % 60).padStart(2, '0')}
          </Text>

          <TouchableOpacity onPress={handleFinish} activeOpacity={0.8}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.finishButton}
            >
              <Text style={styles.finishButtonText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.exerciseModeContainer}>
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Exercise name */}
      <Text style={styles.exerciseModeName}>{exercise.name}</Text>

      {/* Cycle counter */}
      <Text style={styles.cycleCounter}>
        Cycle {currentCycle} of {totalCycles}
      </Text>

      {/* Breathing circle */}
      <View style={styles.circleArea}>
        {/* Outer glow */}
        <Animated.View
          style={[
            styles.circleGlow,
            {
              transform: [{ scale: scaleAnim }],
              opacity: Animated.multiply(opacityAnim, new Animated.Value(0.15)),
            },
          ]}
        />

        {/* Main circle */}
        <Animated.View
          style={[
            styles.circle,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[gradientColors[0] + '40', gradientColors[1] + '60']}
            style={styles.circleGradient}
          >
            <Text style={styles.countdownText}>{phaseCountdown}</Text>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Phase label */}
      <Text style={styles.phaseLabel}>{getPhaseLabel()}</Text>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarTrack}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {Math.round(progress * 100)}%
        </Text>
      </View>

      {/* Pause / Resume */}
      <TouchableOpacity
        style={styles.pauseButton}
        onPress={() => setIsPaused(!isPaused)}
      >
        <Ionicons
          name={isPaused ? 'play' : 'pause'}
          size={24}
          color={colors.accentPrimary}
        />
        <Text style={styles.pauseText}>
          {isPaused ? 'Resume' : 'Pause'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ----- Main Screen -----

export default function BreathingScreen() {
  const [activeExercise, setActiveExercise] = useState<BreathingExercise | null>(null);

  const handleStart = (exercise: BreathingExercise) => {
    setActiveExercise(exercise);
  };

  const handleComplete = async (cycles: number, durationSec: number) => {
    if (activeExercise) {
      try {
        await api.post('/breathing-exercises/complete', {
          exerciseId: activeExercise.id,
          cycles,
          durationSec,
        });
      } catch {
        // Silently fail logging
      }
    }
    setActiveExercise(null);
  };

  const handleBack = () => {
    Alert.alert(
      'End Session?',
      'Are you sure you want to stop this exercise?',
      [
        { text: 'Continue', style: 'cancel' },
        { text: 'End', style: 'destructive', onPress: () => setActiveExercise(null) },
      ]
    );
  };

  if (activeExercise) {
    return (
      <ExerciseMode
        exercise={activeExercise}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    );
  }

  return <ExerciseList onStart={handleStart} />;
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

  // Header
  headerSection: {
    marginBottom: 20,
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

  // Pills
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    paddingRight: 20,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: colors.pillActiveBg,
    borderWidth: 1,
    borderColor: colors.pillActiveBorder,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
  pillTextActive: {
    color: colors.accentPrimary,
  },

  // Exercise cards
  exerciseCard: {
    padding: 18,
    marginBottom: 14,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accentPrimary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  exerciseTiming: {
    fontSize: 11,
    color: colors.textMuted,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: colors.tagBg,
    borderWidth: 1,
    borderColor: colors.tagBorder,
    marginRight: 10,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.accentPrimary,
  },
  cycleText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  startButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ctaText,
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

  // ----- Exercise Mode -----
  exerciseModeContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseModeName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 10,
  },
  cycleCounter: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 30,
  },

  // Circle
  circleArea: {
    width: CIRCLE_SIZE + 40,
    height: CIRCLE_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  circleGlow: {
    position: 'absolute',
    width: CIRCLE_SIZE + 40,
    height: CIRCLE_SIZE + 40,
    borderRadius: (CIRCLE_SIZE + 40) / 2,
    backgroundColor: colors.accentPrimary,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
  },
  circleGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CIRCLE_SIZE / 2,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  phaseLabel: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.accentPrimary,
    marginBottom: 30,
  },

  // Progress bar
  progressBarContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 30,
  },
  progressBarTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.progressBg,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    color: colors.textMuted,
    width: 36,
    textAlign: 'right',
  },

  // Pause
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderCard,
  },
  pauseText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.accentPrimary,
  },

  // Finished
  finishedContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishedIcon: {
    marginBottom: 20,
  },
  finishedTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  finishedSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 40,
  },
  finishButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ctaText,
    letterSpacing: 0.5,
  },
});
