import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, glassCard, gradientColors } from '../theme/colors';

const getAvatarColor = (name: string): string => {
  const palette = [colors.accentPrimary, colors.accentPurple, colors.accentRed, colors.accentSecondary, colors.accentGreen];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
};

const getInitials = (name: string): string =>
  name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);

export default function CounsellorDetailScreen({ navigation, route }: any) {
  const { counsellor } = route.params;

  const qualLines = counsellor.qualifications
    ? counsellor.qualifications.split('\n').filter(Boolean)
    : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Back */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(counsellor.name) }]}>
          <Text style={styles.avatarText}>{getInitials(counsellor.name)}</Text>
        </View>
        <Text style={styles.name}>{counsellor.name}</Text>
        <Text style={styles.spec}>{counsellor.specialization}</Text>
        <View style={styles.heroMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={14} color={colors.accentYellow} />
            <Text style={styles.metaText}>{counsellor.rating?.toFixed(1)}</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <Ionicons name="briefcase-outline" size={14} color={colors.accentPrimary} />
            <Text style={styles.metaText}>{counsellor.experience} yrs exp</Text>
          </View>
        </View>
      </View>

      {/* Tags */}
      {counsellor.tags?.length > 0 && (
        <View style={styles.tagRow}>
          {counsellor.tags.map((t: any) => (
            <View key={t.id} style={styles.tag}>
              <Text style={styles.tagText}>{t.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* About */}
      {counsellor.bio ? (
        <View style={[glassCard, styles.section]}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <Text style={styles.sectionBody}>{counsellor.bio}</Text>
        </View>
      ) : null}

      {/* Qualifications */}
      {qualLines.length > 0 && (
        <View style={[glassCard, styles.section]}>
          <Text style={styles.sectionLabel}>QUALIFICATIONS</Text>
          {qualLines.map((line: string, i: number) => (
            <View key={i} style={styles.qualRow}>
              <View style={styles.qualDot} />
              <Text style={styles.qualText}>{line.trim()}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Book CTA */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.getParent()?.navigate('Book')}
        style={{ marginTop: 8 }}
      >
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
          <Text style={styles.ctaText}>Book a Session →</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  backText: { fontSize: 13, color: colors.textSecondary },

  hero: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#0B0C10', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  spec: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textMuted },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, backgroundColor: 'rgba(111,255,233,0.1)', borderWidth: 1, borderColor: 'rgba(111,255,233,0.15)' },
  tagText: { fontSize: 11, fontWeight: '500', color: colors.accentPrimary },

  section: { padding: 18, marginBottom: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '500', color: colors.textMuted, letterSpacing: 1.5, marginBottom: 10 },
  sectionBody: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  qualRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  qualDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accentPrimary, marginTop: 6 },
  qualText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  cta: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: colors.ctaText, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
});
