import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradientColors } from '../theme/colors';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🧠',
    title: 'Your Mind\nMatters',
    subtitle: 'A safe space for mental wellness. Take assessments, track your mood, and grow every day.',
    color: colors.accentPrimary,
  },
  {
    emoji: '🌿',
    title: 'Connect with\nExperts',
    subtitle: 'Book sessions with certified counsellors who understand you and your journey.',
    color: colors.accentPurple,
  },
  {
    emoji: '✨',
    title: 'Track &\nGrow',
    subtitle: 'See your progress over time. Every small step counts on the path to better wellbeing.',
    color: colors.accentGreen,
  },
];

type Props = { onDone: () => void };

export default function OnboardingScreen({ onDone }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      setActiveIndex(activeIndex + 1);
    } else {
      handleDone();
    }
  };

  const handleDone = async () => {
    await SecureStore.setItemAsync('onboardingDone', '1');
    onDone();
  };

  const slide = SLIDES[activeIndex];

  return (
    <View style={styles.container}>
      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleDone}>
        <Text style={styles.skipText}>Skip →</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {/* Icon */}
            <View style={[styles.iconCircle, { backgroundColor: item.color + '18' }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>

            {/* Text */}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity activeOpacity={0.85} onPress={goNext} style={styles.ctaWrap}>
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
          <Text style={styles.ctaText}>
            {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next →'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, paddingBottom: 48 },
  skipBtn: { position: 'absolute', top: 60, right: 24, zIndex: 10 },
  skipText: { fontSize: 12, color: colors.textMuted },

  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  emoji: { fontSize: 56 },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { height: 3, borderRadius: 2 },
  dotActive: { width: 24, backgroundColor: colors.accentPrimary },
  dotInactive: { width: 8, backgroundColor: colors.borderCard },

  ctaWrap: { paddingHorizontal: 24 },
  cta: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  ctaText: { color: colors.ctaText, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
});
