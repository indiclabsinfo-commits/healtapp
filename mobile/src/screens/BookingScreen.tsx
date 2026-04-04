import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, glassCard, gradientColors } from '../theme/colors';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const CONTACT_EMAIL = 'hello@snowflakescounselling.com';

const TOPICS = [
  { id: 'general', label: 'General counselling enquiry', icon: 'chatbubble-outline' },
  { id: 'anxiety', label: 'Anxiety & stress management', icon: 'pulse-outline' },
  { id: 'depression', label: 'Depression support', icon: 'cloudy-night-outline' },
  { id: 'relationship', label: 'Relationship issues', icon: 'people-outline' },
  { id: 'work', label: 'Work-life balance', icon: 'briefcase-outline' },
  { id: 'academic', label: 'Academic pressure', icon: 'school-outline' },
  { id: 'grief', label: 'Grief & loss', icon: 'heart-outline' },
  { id: 'other', label: 'Something else', icon: 'ellipsis-horizontal-outline' },
] as const;

export default function BookingScreen({ navigation }: Props) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSendEmail = async () => {
    if (!selectedTopic) {
      Alert.alert('Select a topic', 'Please choose what you would like to discuss.');
      return;
    }

    const topicLabel = TOPICS.find((t) => t.id === selectedTopic)?.label ?? selectedTopic;
    const subject = encodeURIComponent(`Counselling Enquiry — ${topicLabel}`);
    const body = encodeURIComponent(
      `Hello Snowflakes Counselling,\n\nI would like to enquire about counselling support.\n\nTopic: ${topicLabel}\n\nPlease get back to me at your earliest convenience.\n\nThank you.`
    );

    const url = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      Alert.alert(
        'No email app found',
        `Please email us directly at ${CONTACT_EMAIL}`,
        [{ text: 'OK' }]
      );
      return;
    }

    await Linking.openURL(url);
    setSent(true);
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={72} color={colors.accentGreen} />
          </View>
          <Text style={styles.successTitle}>Email Opened!</Text>
          <Text style={styles.successSubtitle}>
            Complete and send the email — our team will get back to you within 24 hours.
          </Text>

          <View style={[styles.infoCard, glassCard]}>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={18} color={colors.accentPrimary} />
              <Text style={styles.infoText}>{CONTACT_EMAIL}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color={colors.accentPrimary} />
              <Text style={styles.infoText}>Response within 24 hours</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            style={{ marginTop: 32, width: '100%' }}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>Back to Home</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSent(false)}
            style={{ marginTop: 12 }}
          >
            <Text style={styles.secondaryLink}>Send another enquiry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ width: 22 }} />
      </View>

      <Text style={styles.title}>Connect with a{'\n'}Counsellor</Text>
      <Text style={styles.subtitle}>
        Reach out to Snowflakes Counselling — we'll get back to you within 24 hours
      </Text>

      {/* Topic selection */}
      <Text style={styles.sectionLabel}>WHAT WOULD YOU LIKE TO DISCUSS?</Text>

      <View style={styles.topicList}>
        {TOPICS.map((topic) => {
          const isSelected = selectedTopic === topic.id;
          return (
            <TouchableOpacity
              key={topic.id}
              onPress={() => setSelectedTopic(topic.id)}
              activeOpacity={0.7}
              style={[
                styles.topicRow,
                glassCard,
                isSelected && styles.topicRowSelected,
              ]}
            >
              <View
                style={[
                  styles.topicRadio,
                  isSelected && styles.topicRadioSelected,
                ]}
              >
                {isSelected && (
                  <View style={styles.topicRadioInner} />
                )}
              </View>
              <Text
                style={[
                  styles.topicLabel,
                  isSelected && styles.topicLabelSelected,
                ]}
              >
                {topic.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CTA */}
      <TouchableOpacity
        onPress={handleSendEmail}
        activeOpacity={0.8}
        style={{ marginTop: 8 }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaText}>Send Enquiry Email →</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Contact info */}
      <View style={[styles.infoCard, glassCard, { marginTop: 20 }]}>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={16} color={colors.accentPrimary} />
          <Text style={styles.infoText}>{CONTACT_EMAIL}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={colors.accentPrimary} />
          <Text style={styles.infoText}>Response within 24 hours</Text>
        </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  topicList: {
    gap: 10,
    marginBottom: 24,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  topicRowSelected: {
    borderColor: 'rgba(111,255,233,0.25)',
    backgroundColor: 'rgba(111,255,233,0.06)',
  },
  topicRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicRadioSelected: {
    borderColor: colors.accentPrimary,
  },
  topicRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accentPrimary,
  },
  topicLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  topicLabelSelected: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  ctaButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: colors.ctaText,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  infoCard: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.borderCard,
    marginVertical: 12,
  },

  // Success screen
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(74,222,128,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  secondaryLink: {
    fontSize: 13,
    color: colors.accentPrimary,
    fontWeight: '500',
    textAlign: 'center',
  },
});
