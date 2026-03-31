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
import Slider from '@react-native-community/slider';
import { colors, glassCard, gradientColors } from '../theme/colors';
import api from '../config/api';

// ----- Types -----

interface Questionnaire {
  id: number;
  title: string;
  categoryId: number;
  levelId: number;
  questionIds: number[] | string;
  published: boolean;
}

interface QuestionOption {
  text: string;
  score: number;
}

interface Question {
  id: number;
  text: string;
  type: 'MCQ' | 'SCALE' | 'YESNO';
  options: QuestionOption[] | string;
  levelId: number;
}

interface QuestionnaireDetail {
  id: number;
  title: string;
  questions: Question[];
}

interface Answer {
  questionId: number;
  answer: number;
}

// ----- Helper -----

function parseOptions(options: QuestionOption[] | string): QuestionOption[] {
  if (typeof options === 'string') {
    try {
      return JSON.parse(options);
    } catch {
      return [];
    }
  }
  return options || [];
}

function parseQuestionIds(ids: number[] | string): number[] {
  if (typeof ids === 'string') {
    try {
      return JSON.parse(ids);
    } catch {
      return [];
    }
  }
  return ids || [];
}

// ----- Browse Mode: Questionnaire List -----

function QuestionnaireBrowse({
  onStart,
  onBack,
}: {
  onStart: (q: QuestionnaireDetail) => void;
  onBack: () => void;
}) {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<number | null>(null);

  const fetchQuestionnaires = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/questionnaires', {
        params: { published: true, limit: 50 },
      });
      setQuestionnaires(response.data.data || []);
    } catch {
      setError('Failed to load assessments. Tap to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestionnaires();
  }, [fetchQuestionnaires]);

  const handleStart = async (q: Questionnaire) => {
    setStartingId(q.id);
    try {
      const response = await api.get(`/questionnaires/${q.id}`);
      const detail: QuestionnaireDetail = response.data.data;
      if (!detail.questions || detail.questions.length === 0) {
        Alert.alert('No Questions', 'This assessment has no questions yet.');
        return;
      }
      onStart(detail);
    } catch {
      Alert.alert('Error', 'Failed to load assessment questions.');
    } finally {
      setStartingId(null);
    }
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
        <TouchableOpacity onPress={fetchQuestionnaires}>
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
        <Text style={styles.screenTitle}>Self Assessment</Text>
        <Text style={styles.screenSubtitle}>
          Discover insights about your wellbeing
        </Text>
      </View>

      {/* Questionnaire cards */}
      {questionnaires.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>No assessments available yet.</Text>
        </View>
      ) : (
        questionnaires.map((q) => {
          const questionCount = parseQuestionIds(q.questionIds).length;
          return (
            <View key={q.id} style={[styles.questionnaireCard, glassCard]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <Ionicons
                    name="clipboard-outline"
                    size={20}
                    color={colors.accentPrimary}
                  />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{q.title}</Text>
                  <Text style={styles.cardMeta}>
                    {questionCount} question{questionCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleStart(q)}
                activeOpacity={0.8}
                disabled={startingId === q.id}
              >
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.startButton}
                >
                  {startingId === q.id ? (
                    <ActivityIndicator size="small" color={colors.ctaText} />
                  ) : (
                    <>
                      <Text style={styles.startButtonText}>Start</Text>
                      <Ionicons name="arrow-forward" size={14} color={colors.ctaText} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

// ----- Quiz Mode -----

function QuizMode({
  questionnaire,
  onComplete,
  onBack,
}: {
  questionnaire: QuestionnaireDetail;
  onComplete: (score: number) => void;
  onBack: () => void;
}) {
  const questions = questionnaire.questions;
  const totalQuestions = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [scaleValue, setScaleValue] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentQuestion = questions[currentIndex];
  const options = parseOptions(currentQuestion.options);
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    // Execute callback at the midpoint
    setTimeout(callback, 150);
  };

  const handleNext = () => {
    let answerValue: number;

    if (currentQuestion.type === 'SCALE') {
      answerValue = scaleValue;
    } else if (selectedOption === null) {
      Alert.alert('Select an answer', 'Please choose an option before continuing.');
      return;
    } else {
      answerValue = selectedOption;
    }

    const newAnswers = [
      ...answers,
      { questionId: currentQuestion.id, answer: answerValue },
    ];
    setAnswers(newAnswers);

    if (isLastQuestion) {
      handleSubmit(newAnswers);
    } else {
      animateTransition(() => {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
        setScaleValue(5);
      });
    }
  };

  const handleSubmit = async (finalAnswers: Answer[]) => {
    setSubmitting(true);
    try {
      const response = await api.post('/assessments', {
        questionnaireId: questionnaire.id,
        answers: finalAnswers,
      });
      const score = response.data.data?.score ?? 0;
      onComplete(score);
    } catch {
      Alert.alert('Error', 'Failed to submit assessment. Please try again.');
      setSubmitting(false);
    }
  };

  const handleBackPress = () => {
    Alert.alert(
      'Leave Assessment?',
      'Your progress will be lost if you leave now.',
      [
        { text: 'Continue', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: onBack },
      ]
    );
  };

  const progress = (currentIndex + 1) / totalQuestions;

  if (submitting) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
        <Text style={[styles.errorText, { marginTop: 16 }]}>
          Calculating your results...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.quizContainer}>
      {/* Top bar */}
      <View style={styles.quizTopBar}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.quizTitle}>Self Assessment</Text>
        <Text style={styles.quizCounter}>
          {currentIndex + 1}/{totalQuestions}
        </Text>
      </View>

      {/* Segmented progress bar */}
      <View style={styles.progressSegments}>
        {questions.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              { flex: 1 },
            ]}
          >
            {i <= currentIndex ? (
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressSegmentFill}
              />
            ) : (
              <View style={styles.progressSegmentEmpty} />
            )}
          </View>
        ))}
      </View>

      {/* Category tag + percentage */}
      <View style={styles.tagRow}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{questionnaire.title}</Text>
        </View>
        <Text style={styles.percentText}>
          {Math.round(progress * 100)}% complete
        </Text>
      </View>

      {/* Question */}
      <ScrollView style={styles.questionArea} contentContainerStyle={styles.questionContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.questionText}>
            {currentQuestion.text}
            <Text style={{ color: colors.accentPrimary }}>?</Text>
          </Text>

          {/* MCQ Options */}
          {currentQuestion.type === 'MCQ' && (
            <View style={styles.optionsList}>
              {options.map((opt, idx) => {
                const isSelected = selectedOption === opt.score;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.optionCard,
                      glassCard,
                      isSelected && styles.optionCardSelected,
                    ]}
                    onPress={() => setSelectedOption(opt.score)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={12} color={colors.ctaText} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {opt.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* YESNO Options */}
          {currentQuestion.type === 'YESNO' && (
            <View style={styles.yesNoRow}>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  glassCard,
                  selectedOption === 1 && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedOption(1)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={24}
                  color={selectedOption === 1 ? colors.accentPrimary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.yesNoText,
                    selectedOption === 1 && styles.optionTextSelected,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  glassCard,
                  selectedOption === 0 && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedOption(0)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={24}
                  color={selectedOption === 0 ? colors.accentRed : colors.textMuted}
                />
                <Text
                  style={[
                    styles.yesNoText,
                    selectedOption === 0 && styles.optionTextSelected,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* SCALE */}
          {currentQuestion.type === 'SCALE' && (
            <View style={styles.scaleContainer}>
              <View style={styles.scaleValueWrap}>
                <Text style={styles.scaleValue}>{scaleValue}</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={scaleValue}
                onValueChange={setScaleValue}
                minimumTrackTintColor={colors.accentPrimary}
                maximumTrackTintColor={colors.progressBg}
                thumbTintColor={colors.accentPrimary}
              />
              <View style={styles.scaleLabels}>
                <Text style={styles.scaleLabelText}>Low</Text>
                <Text style={styles.scaleLabelText}>High</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Next / Submit button */}
      <View style={styles.bottomAction}>
        <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>
              {isLastQuestion ? 'Submit' : 'Next Question'}
            </Text>
            <Ionicons
              name={isLastQuestion ? 'checkmark' : 'arrow-forward'}
              size={16}
              color={colors.ctaText}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ----- Result Screen -----

function ResultScreen({
  score,
  onDone,
}: {
  score: number;
  onDone: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const getScoreColor = () => {
    if (score >= 75) return colors.accentGreen;
    if (score >= 50) return colors.accentYellow;
    return colors.accentRed;
  };

  const getScoreLabel = () => {
    if (score >= 75) return 'Excellent';
    if (score >= 50) return 'Moderate';
    if (score >= 25) return 'Needs Attention';
    return 'Seek Support';
  };

  return (
    <View style={styles.resultContainer}>
      <Animated.View
        style={[
          styles.resultContent,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View
          style={[
            styles.scoreCircle,
            { borderColor: getScoreColor() },
          ]}
        >
          <Text style={[styles.scoreText, { color: getScoreColor() }]}>
            {Math.round(score)}%
          </Text>
        </View>

        <Text style={styles.resultTitle}>Assessment Complete</Text>
        <Text style={[styles.resultLabel, { color: getScoreColor() }]}>
          {getScoreLabel()}
        </Text>
        <Text style={styles.resultSubtitle}>
          Your wellness score has been recorded. Check your analytics for trends over time.
        </Text>
      </Animated.View>

      <View style={styles.bottomAction}>
        <TouchableOpacity onPress={onDone} activeOpacity={0.8}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>Done</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ----- Main Screen -----

type Mode = 'browse' | 'quiz' | 'result';

export default function AssessmentScreen({ navigation }: { navigation: any }) {
  const [mode, setMode] = useState<Mode>('browse');
  const [activeQuestionnaire, setActiveQuestionnaire] =
    useState<QuestionnaireDetail | null>(null);
  const [resultScore, setResultScore] = useState(0);

  const handleStart = (q: QuestionnaireDetail) => {
    setActiveQuestionnaire(q);
    setMode('quiz');
  };

  const handleComplete = (score: number) => {
    setResultScore(score);
    setMode('result');
  };

  const handleDone = () => {
    setActiveQuestionnaire(null);
    setResultScore(0);
    setMode('browse');
  };

  const handleBack = () => {
    setActiveQuestionnaire(null);
    setMode('browse');
  };

  const handleBrowseBack = () => {
    navigation.goBack();
  };

  if (mode === 'result') {
    return <ResultScreen score={resultScore} onDone={handleDone} />;
  }

  if (mode === 'quiz' && activeQuestionnaire) {
    return (
      <QuizMode
        questionnaire={activeQuestionnaire}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    );
  }

  return <QuestionnaireBrowse onStart={handleStart} onBack={handleBrowseBack} />;
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

  // Questionnaire cards
  questionnaireCard: {
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accentPrimary + '15',
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
    fontSize: 11,
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

  // ----- Quiz Mode -----
  quizContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingTop: 60,
  },
  quizTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quizTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quizCounter: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },

  // Segmented progress
  progressSegments: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressSegment: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressSegmentFill: {
    flex: 1,
    borderRadius: 2,
  },
  progressSegmentEmpty: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: colors.progressBg,
  },

  // Tag row
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: colors.tagBg,
    borderWidth: 1,
    borderColor: colors.tagBorder,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.accentPrimary,
  },
  percentText: {
    fontSize: 10,
    color: colors.textMuted,
  },

  // Question area
  questionArea: {
    flex: 1,
  },
  questionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 32,
    marginBottom: 28,
  },

  // MCQ options
  optionsList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionCardSelected: {
    backgroundColor: colors.pillActiveBg,
    borderColor: colors.pillActiveBorder,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioCircleSelected: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimary,
  },
  optionText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  optionTextSelected: {
    color: colors.textPrimary,
    fontWeight: '600',
  },

  // Yes/No
  yesNoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  yesNoButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  yesNoText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // Scale
  scaleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  scaleValueWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.pillActiveBg,
    borderWidth: 1,
    borderColor: colors.pillActiveBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  scaleValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.accentPrimary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  scaleLabelText: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },

  // Bottom action
  bottomAction: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 12,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ctaText,
    letterSpacing: 0.5,
  },

  // ----- Result Screen -----
  resultContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'space-between',
  },
  resultContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '700',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
