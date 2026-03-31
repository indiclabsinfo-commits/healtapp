import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, glassCard, gradientColors } from '../theme/colors';
import { useAuthStore } from '../store/auth';
import api from '../config/api';

interface UserStats {
  assessments: number;
  sessions: number;
  streak: number;
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [stats, setStats] = useState<UserStats>({
    assessments: 0,
    sessions: 0,
    streak: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/analytics/user');
      const data = response.data.data || {};
      setStats({
        assessments: data.totalAssessments || 0,
        sessions: data.totalSessions || 0,
        streak: data.currentStreak || 0,
      });
    } catch {
      // Keep defaults
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMemberSince = (): string => {
    if (!user?.createdAt) return '';
    const date = new Date(user.createdAt);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const initials = getInitials(user?.name || 'U');

  const menuItems: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
  }[] = [
    { icon: 'bar-chart-outline', label: 'Assessment History', onPress: () => {} },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => {} },
    { icon: 'lock-closed-outline', label: 'Privacy & Security', onPress: () => {} },
    { icon: 'settings-outline', label: 'Settings', onPress: () => {} },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </LinearGradient>

        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.memberSince}>
          Member since {getMemberSince()}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, glassCard]}>
          <Text style={styles.statValue}>{stats.assessments}</Text>
          <Text style={styles.statLabel}>Assessments</Text>
        </View>
        <View style={[styles.statCard, glassCard]}>
          <Text style={styles.statValue}>{stats.sessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={[styles.statCard, glassCard]}>
          <Text style={styles.statValue}>{stats.streak}d</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      {/* Menu items */}
      <View style={[styles.menuContainer, glassCard]}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.menuItem,
              index < menuItems.length - 1 && styles.menuItemBorder,
            ]}
            onPress={item.onPress}
            activeOpacity={0.6}
          >
            <View style={styles.menuLeft}>
              <Ionicons name={item.icon} size={18} color={colors.textSecondary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
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
    paddingTop: 70,
    paddingBottom: 100,
    alignItems: 'center',
  },

  // Avatar section
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ctaText,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.accentPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },

  // Menu
  menuContainer: {
    width: '100%',
    overflow: 'hidden',
    marginBottom: 28,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderCard,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuLabel: {
    fontSize: 13,
    color: colors.textPrimary,
  },

  // Sign out
  signOutButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accentPrimary,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accentPrimary,
  },
});
