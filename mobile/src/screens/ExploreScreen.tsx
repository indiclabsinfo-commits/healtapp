import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, glassCard } from '../theme/colors';
import api from '../config/api';

interface Counsellor {
  id: number;
  name: string;
  specialization: string;
  qualifications: string;
  experience: number;
  bio: string;
  rating: number;
  photo: string | null;
  tags: { id: number; name: string }[];
}

// Generate a consistent color for avatar based on name
const getAvatarColor = (name: string): string => {
  const avatarColors = [
    colors.accentPrimary,
    colors.accentPurple,
    colors.accentRed,
    colors.accentYellow,
    colors.accentGreen,
    colors.accentSecondary,
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function ExploreScreen({ navigation }: { navigation: any }) {
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const fetchCounsellors = useCallback(async () => {
    setError(null);
    try {
      const params: any = { limit: 50 };
      if (selectedTag) params.tag = selectedTag;
      const response = await api.get('/counsellors', { params });
      setCounsellors(response.data.data || []);
    } catch {
      setError('Failed to load counsellors.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTag]);

  useEffect(() => {
    setLoading(true);
    fetchCounsellors();
  }, [fetchCounsellors]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCounsellors();
  };

  // Derive tags from all counsellors
  const allTags = Array.from(
    new Set(counsellors.flatMap((c) => c.tags?.map((t) => t.name) || []))
  );

  // Filter by search text
  const filtered = counsellors.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.specialization.toLowerCase().includes(q) ||
      c.tags?.some((t) => t.name.toLowerCase().includes(q))
    );
  });

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    const stars: string[] = [];
    for (let i = 0; i < full; i++) stars.push('star');
    if (half) stars.push('star-half');
    while (stars.length < 5) stars.push('star-outline');
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
    );
  }

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
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.screenTitle}>Find Your{'\n'}Expert</Text>
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, glassCard]}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or specialization..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          <TouchableOpacity
            style={[styles.pill, !selectedTag && styles.pillActive]}
            onPress={() => setSelectedTag(null)}
          >
            <Text style={[styles.pillText, !selectedTag && styles.pillTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {allTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.pill, selectedTag === tag && styles.pillActive]}
              onPress={() =>
                setSelectedTag(selectedTag === tag ? null : tag)
              }
            >
              <Text
                style={[
                  styles.pillText,
                  selectedTag === tag && styles.pillTextActive,
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchCounsellors}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Counsellor cards */}
      {filtered.length === 0 && !error ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>
            {search ? 'No counsellors match your search.' : 'No counsellors available.'}
          </Text>
        </View>
      ) : (
        filtered.map((counsellor) => {
          const avatarColor = getAvatarColor(counsellor.name);
          const initials = getInitials(counsellor.name);
          const stars = renderStars(counsellor.rating);

          return (
            <TouchableOpacity key={counsellor.id} style={[styles.counsellorCard, glassCard]} activeOpacity={0.85} onPress={() => navigation.navigate('CounsellorDetail', { counsellor })}>
              <View style={styles.counsellorHeader}>
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: avatarColor + '20' }]}>
                  <Text style={[styles.avatarText, { color: avatarColor }]}>
                    {initials}
                  </Text>
                </View>

                {/* Info */}
                <View style={styles.counsellorInfo}>
                  <Text style={styles.counsellorName}>{counsellor.name}</Text>
                  <Text style={styles.counsellorSpec}>
                    {counsellor.specialization} &middot; {counsellor.experience} yrs
                  </Text>

                  {/* Rating */}
                  <View style={styles.ratingRow}>
                    {stars.map((star, i) => (
                      <Ionicons
                        key={i}
                        name={star as any}
                        size={12}
                        color={colors.accentYellow}
                      />
                    ))}
                    <Text style={styles.ratingText}>
                      {counsellor.rating.toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Tags */}
              {counsellor.tags && counsellor.tags.length > 0 && (
                <View style={styles.tagRow}>
                  {counsellor.tags.map((tag) => (
                    <View key={tag.id} style={styles.tag}>
                      <Text style={styles.tagText}>{tag.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
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
  centered: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSection: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 32,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
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

  // Error
  errorBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  retryText: {
    color: colors.accentPrimary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },

  // Empty
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

  // Counsellor card
  counsellorCard: {
    padding: 18,
    marginBottom: 12,
  },
  counsellorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  counsellorInfo: {
    flex: 1,
  },
  counsellorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  counsellorSpec: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
  },

  // Tags
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
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
    fontSize: 9,
    fontWeight: '500',
    color: colors.accentPrimary,
  },
});
