import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, glassCard } from '../theme/colors';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

// Notifications are delivered via push (expo-notifications). Until backend exposes a
// /notifications endpoint, this screen serves as a placeholder for past push history.
// Real history will arrive from `/notifications` once that route is built.
export default function NotificationsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
        </View>

        <View style={[glassCard, styles.empty]}>
          <Ionicons name="notifications-outline" size={36} color={colors.accentPrimary} />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyHint}>
            You'll see assignment reminders, session alerts, and check-in nudges here.
          </Text>
        </View>
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
  empty: { padding: 32, borderRadius: 16, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  emptyHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
