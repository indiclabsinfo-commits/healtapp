import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, glassCard, gradientColors } from '../theme/colors';
import { useAuthStore } from '../store/auth';
import api from '../config/api';

type Props = { navigation: any };

interface Counsellor {
  id: number;
  name: string;
  specialization: string;
  rating: number;
  tags: { id: number; name: string }[];
}

interface Slot {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  duration: number;
  isAvailable: boolean;
}

const DAY_LABELS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getAvatarColor = (name: string): string => {
  const palette = [colors.accentPrimary, colors.accentPurple, colors.accentRed, colors.accentSecondary, colors.accentGreen];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
};

const getInitials = (name: string): string =>
  name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);

// Next date for a given dayOfWeek (1=Mon … 7=Sun).
// `slotStartTime` (HH:MM) lets us include today if its slot is still in the future.
const nextDateForDay = (dow: number, slotStartTime?: string): Date => {
  const today = new Date();
  const todayDow = today.getDay() === 0 ? 7 : today.getDay();
  let diff = dow - todayDow;
  if (diff < 0) diff += 7;
  // Same-day: only include if the slot start time is still in the future
  if (diff === 0 && slotStartTime) {
    const [h, m] = slotStartTime.split(':').map(Number);
    const slotDt = new Date(today);
    slotDt.setHours(h || 0, m || 0, 0, 0);
    if (slotDt.getTime() <= today.getTime()) diff = 7;
  } else if (diff === 0 && !slotStartTime) {
    // No time given — skip same-day to avoid past-time bookings
    diff = 7;
  }
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d;
};

export default function BookingScreen({ navigation }: Props) {
  const memberships = useAuthStore((s) => s.memberships);
  const orgId = memberships[0]?.organization?.id;

  const [step, setStep] = useState<'pick-counsellor' | 'pick-slot' | 'confirm' | 'done'>('pick-counsellor');
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [loadingCounsellors, setLoadingCounsellors] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedCounsellor, setSelectedCounsellor] = useState<Counsellor | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [booking, setBooking] = useState(false);

  const loadCounsellors = useCallback(async () => {
    try {
      setLoadingCounsellors(true);
      if (orgId) {
        try {
          const res = await api.get(`/organizations/${orgId}/my-counsellors`);
          const assigned = res.data.data || [];
          if (assigned.length > 0) {
            setCounsellors(assigned);
            return;
          }
        } catch {
          // fall through to global list
        }
      }
      const res = await api.get('/counsellors');
      setCounsellors(res.data.data || []);
    } catch {
      setCounsellors([]);
    } finally {
      setLoadingCounsellors(false);
    }
  }, [orgId]);

  useEffect(() => { loadCounsellors(); }, [loadCounsellors]);

  const pickCounsellor = async (c: Counsellor) => {
    setSelectedCounsellor(c);
    setStep('pick-slot');
    setLoadingSlots(true);
    try {
      const res = await api.get(`/consultations/slots/${c.id}`);
      setSlots((res.data.data || []).filter((s: Slot) => s.isAvailable));
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const confirmBooking = async () => {
    if (booking) return; // Re-entry guard — prevents double-booking on rapid taps
    if (!selectedCounsellor || !selectedSlot) return;
    setBooking(true);
    const date = nextDateForDay(selectedSlot.dayOfWeek, selectedSlot.startTime);
    try {
      await api.post('/consultations', {
        counsellorId: selectedCounsellor.id,
        organizationId: orgId,
        date: date.toISOString(),
        time: selectedSlot.startTime,
        duration: selectedSlot.duration,
        type: 'IN_PERSON',
      });
      setStep('done');
    } catch (err: any) {
      Alert.alert('Booking failed', err.response?.data?.error || 'Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCounsellors();
    setRefreshing(false);
  };

  // ── DONE ────────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark-circle" size={72} color={colors.accentGreen} />
          </View>
          <Text style={styles.doneTitle}>Session Booked!</Text>
          <Text style={styles.doneSub}>
            Your session with {selectedCounsellor?.name} on {DAY_LABELS[selectedSlot?.dayOfWeek ?? 0]} at {selectedSlot?.startTime} has been confirmed.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={{ marginTop: 32, width: '100%' }}
            onPress={() => { setStep('pick-counsellor'); setSelectedCounsellor(null); setSelectedSlot(null); }}
          >
            <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
              <Text style={styles.ctaText}>Book Another</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 12 }} onPress={() => navigation.navigate('SessionsList')}>
            <Text style={styles.secondaryLink}>View My Sessions →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── CONFIRM ──────────────────────────────────────────────────────────────────
  if (step === 'confirm' && selectedCounsellor && selectedSlot) {
    const date = nextDateForDay(selectedSlot.dayOfWeek);
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => setStep('pick-slot')} style={styles.backRow}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Confirm Booking</Text>

        <View style={[glassCard, styles.confirmCard]}>
          <View style={[styles.avatar, { backgroundColor: getAvatarColor(selectedCounsellor.name) }]}>
            <Text style={styles.avatarText}>{getInitials(selectedCounsellor.name)}</Text>
          </View>
          <Text style={styles.confirmName}>{selectedCounsellor.name}</Text>
          <Text style={styles.confirmSpec}>{selectedCounsellor.specialization}</Text>

          <View style={styles.confirmDivider} />

          <View style={styles.confirmRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.accentPrimary} />
            <Text style={styles.confirmDetail}>
              {DAY_LABELS[selectedSlot.dayOfWeek]}, {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.confirmRow}>
            <Ionicons name="time-outline" size={16} color={colors.accentPrimary} />
            <Text style={styles.confirmDetail}>{selectedSlot.startTime} — {selectedSlot.endTime}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Ionicons name="hourglass-outline" size={16} color={colors.accentPrimary} />
            <Text style={styles.confirmDetail}>{selectedSlot.duration} minutes · In-person</Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={confirmBooking} disabled={booking}>
          <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            {booking ? <ActivityIndicator color={colors.ctaText} /> : <Text style={styles.ctaText}>Confirm Booking →</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── PICK SLOT ────────────────────────────────────────────────────────────────
  if (step === 'pick-slot' && selectedCounsellor) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => setStep('pick-counsellor')} style={styles.backRow}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Pick a Slot</Text>
        <Text style={styles.pageSub}>with {selectedCounsellor.name}</Text>

        {loadingSlots ? (
          <ActivityIndicator color={colors.accentPrimary} style={{ marginTop: 40 }} />
        ) : slots.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No available slots</Text>
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 8 }}>
            {slots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              return (
                <TouchableOpacity
                  key={slot.id}
                  onPress={() => setSelectedSlot(slot)}
                  style={[glassCard, styles.slotRow, isSelected && styles.slotRowActive]}
                  activeOpacity={0.7}
                >
                  <View style={styles.slotDay}>
                    <Text style={[styles.slotDayText, isSelected && { color: colors.accentPrimary }]}>
                      {DAY_LABELS[slot.dayOfWeek]}
                    </Text>
                  </View>
                  <View style={styles.slotMid}>
                    <Text style={[styles.slotTime, isSelected && { color: colors.textPrimary }]}>
                      {slot.startTime} — {slot.endTime}
                    </Text>
                    <Text style={styles.slotDur}>{slot.duration} min</Text>
                  </View>
                  <View style={[styles.slotRadio, isSelected && styles.slotRadioActive]}>
                    {isSelected && <View style={styles.slotRadioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {selectedSlot && (
          <TouchableOpacity activeOpacity={0.8} onPress={() => setStep('confirm')} style={{ marginTop: 24 }}>
            <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
              <Text style={styles.ctaText}>Continue →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  // ── PICK COUNSELLOR ──────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentPrimary} />}
    >
      <Text style={styles.pageTitle}>Book a Session</Text>
      <Text style={styles.pageSub}>Choose your counsellor</Text>

      {loadingCounsellors ? (
        <ActivityIndicator color={colors.accentPrimary} style={{ marginTop: 40 }} />
      ) : counsellors.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="person-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>No counsellors available</Text>
        </View>
      ) : (
        <View style={{ gap: 12, marginTop: 8 }}>
          {counsellors.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => pickCounsellor(c)}
              style={[glassCard, styles.counsellorCard]}
              activeOpacity={0.8}
            >
              <View style={[styles.avatar, { backgroundColor: getAvatarColor(c.name) }]}>
                <Text style={styles.avatarText}>{getInitials(c.name)}</Text>
              </View>
              <View style={styles.counsellorInfo}>
                <Text style={styles.counsellorName}>{c.name}</Text>
                <Text style={styles.counsellorSpec}>{c.specialization}</Text>
                {c.tags?.length > 0 && (
                  <View style={styles.tagRow}>
                    {c.tags.slice(0, 3).map((t) => (
                      <View key={t.id} style={styles.tag}>
                        <Text style={styles.tagText}>{t.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.ratingBox}>
                <Ionicons name="star" size={12} color={colors.accentYellow} />
                <Text style={styles.ratingText}>{c.rating?.toFixed(1)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, marginBottom: 4, lineHeight: 34 },
  pageSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 20 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  backText: { fontSize: 13, color: colors.textSecondary },

  counsellorCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#0B0C10', fontSize: 16, fontWeight: '700' },
  counsellorInfo: { flex: 1 },
  counsellorName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  counsellorSpec: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, backgroundColor: 'rgba(111,255,233,0.1)', borderWidth: 1, borderColor: 'rgba(111,255,233,0.15)' },
  tagText: { fontSize: 10, fontWeight: '500', color: colors.accentPrimary },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 12, fontWeight: '600', color: colors.accentYellow },

  slotRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  slotRowActive: { borderColor: 'rgba(111,255,233,0.25)', backgroundColor: 'rgba(111,255,233,0.06)' },
  slotDay: { width: 40 },
  slotDayText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  slotMid: { flex: 1 },
  slotTime: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  slotDur: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  slotRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.textMuted, alignItems: 'center', justifyContent: 'center' },
  slotRadioActive: { borderColor: colors.accentPrimary },
  slotRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentPrimary },

  confirmCard: { padding: 20, alignItems: 'center', marginBottom: 24 },
  confirmName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 12, marginBottom: 4 },
  confirmSpec: { fontSize: 12, color: colors.textSecondary, marginBottom: 16 },
  confirmDivider: { width: '100%', height: 1, backgroundColor: colors.borderCard, marginBottom: 16 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, alignSelf: 'flex-start' },
  confirmDetail: { fontSize: 14, color: colors.textPrimary },

  cta: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: colors.ctaText, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  secondaryLink: { fontSize: 13, color: colors.accentPrimary, fontWeight: '500', textAlign: 'center' },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: colors.textMuted },
  doneIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(74,222,128,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  doneTitle: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  doneSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
});
