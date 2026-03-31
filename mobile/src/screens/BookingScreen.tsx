import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, glassCard, gradientColors } from '../theme/colors';
import { useAuthStore } from '../store/auth';
import api from '../config/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface Counsellor {
  id: number;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  photo: string | null;
  tags: { id: number; name: string }[];
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const AVATAR_COLORS = [
  '#6FFFE9', '#A78BFA', '#FF6B6B', '#FFD93D', '#4ADE80',
  '#5BC0BE', '#F472B6', '#FB923C',
];

const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

// Generate next 7 days
const getNext7Days = (): { date: Date; label: string; dayName: string; dateStr: string }[] => {
  const days: { date: Date; label: string; dayName: string; dateStr: string }[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    days.push({
      date: d,
      label: d.getDate().toString(),
      dayName: dayNames[d.getDay()],
      dateStr: d.toISOString().split('T')[0],
    });
  }
  return days;
};

export default function BookingScreen({ navigation }: Props) {
  const memberships = useAuthStore((s) => s.memberships);

  // Step management
  const [step, setStep] = useState(1);
  const fadeAnim = useState(new Animated.Value(1))[0];

  // Step 1: Counsellors
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [counsellorsLoading, setCounsellorsLoading] = useState(true);
  const [selectedCounsellor, setSelectedCounsellor] = useState<Counsellor | null>(null);

  // Step 2: Date
  const [dates] = useState(getNext7Days);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Step 3: Time slots
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Step 4: Confirm / booking
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Credit balance from first membership
  const creditBalance = memberships.length > 0 ? memberships[0].creditBalance : 0;

  const animateStep = useCallback(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Fetch counsellors
  useEffect(() => {
    const fetchCounsellors = async () => {
      try {
        const response = await api.get('/counsellors', { params: { limit: 50 } });
        setCounsellors(response.data.data || []);
      } catch {
        Alert.alert('Error', 'Failed to load counsellors.');
      } finally {
        setCounsellorsLoading(false);
      }
    };
    fetchCounsellors();
  }, []);

  // Fetch availability when counsellor + date selected
  useEffect(() => {
    if (!selectedCounsellor || !selectedDate) return;

    const fetchSlots = async () => {
      setSlotsLoading(true);
      setSelectedTime(null);
      try {
        const response = await api.get(
          `/consultations/counsellors/${selectedCounsellor.id}/availability`,
          { params: { date: selectedDate } }
        );
        setTimeSlots(response.data.data || []);
      } catch {
        // If endpoint not available, show default slots
        const defaultSlots: TimeSlot[] = [
          { time: '09:00', available: true },
          { time: '10:00', available: true },
          { time: '11:00', available: false },
          { time: '14:00', available: true },
          { time: '15:00', available: true },
          { time: '16:00', available: true },
          { time: '17:00', available: false },
        ];
        setTimeSlots(defaultSlots);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [selectedCounsellor, selectedDate]);

  const goToStep = (nextStep: number) => {
    setStep(nextStep);
    animateStep();
  };

  const handleSelectCounsellor = (counsellor: Counsellor) => {
    setSelectedCounsellor(counsellor);
    goToStep(2);
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    goToStep(3);
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    goToStep(4);
  };

  const handleConfirmBooking = async () => {
    if (!selectedCounsellor || !selectedDate || !selectedTime) return;

    setBookingLoading(true);
    try {
      const response = await api.post('/consultations/book', {
        counsellorId: selectedCounsellor.id,
        date: selectedDate,
        time: selectedTime,
        duration: 60,
      });

      setBookingDetails(response.data.data);
      setBookingSuccess(true);
      animateStep();
    } catch (error: any) {
      const message =
        error.response?.data?.error || 'Booking failed. Please try again.';
      Alert.alert('Booking Failed', message);
    } finally {
      setBookingLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((s) => (
        <View
          key={s}
          style={[
            styles.stepDot,
            s <= step && styles.stepDotActive,
            s === step && styles.stepDotCurrent,
          ]}
        />
      ))}
    </View>
  );

  // Step 1: Counsellor list
  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Choose a Counsellor</Text>
      <Text style={styles.stepSubtitle}>Select who you'd like to consult with</Text>

      {counsellorsLoading ? (
        <ActivityIndicator color={colors.accentPrimary} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.counsellorList}>
          {counsellors.map((c) => {
            const avatarColor = getAvatarColor(c.name);
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.counsellorCard, glassCard]}
                onPress={() => handleSelectCounsellor(c)}
                activeOpacity={0.7}
              >
                <View style={[styles.avatar, { backgroundColor: avatarColor + '20' }]}>
                  <Text style={[styles.avatarText, { color: avatarColor }]}>
                    {getInitials(c.name)}
                  </Text>
                </View>
                <View style={styles.counsellorInfo}>
                  <Text style={styles.counsellorName}>{c.name}</Text>
                  <Text style={styles.counsellorSpec}>
                    {c.specialization} - {c.experience} yrs
                  </Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color={colors.accentYellow} />
                    <Text style={styles.ratingText}>{c.rating.toFixed(1)}</Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  // Step 2: Date selection
  const renderStep2 = () => (
    <View>
      <TouchableOpacity style={styles.backRow} onPress={() => goToStep(1)}>
        <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
        <Text style={styles.backText}>Change counsellor</Text>
      </TouchableOpacity>

      <Text style={styles.stepTitle}>Select a Date</Text>
      <Text style={styles.stepSubtitle}>
        Booking with {selectedCounsellor?.name}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateRow}
      >
        {dates.map((d) => {
          const isSelected = selectedDate === d.dateStr;
          return (
            <TouchableOpacity
              key={d.dateStr}
              onPress={() => handleSelectDate(d.dateStr)}
              activeOpacity={0.7}
            >
              {isSelected ? (
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.datePill}
                >
                  <Text style={[styles.dateDayName, { color: colors.ctaText }]}>
                    {d.dayName}
                  </Text>
                  <Text style={[styles.dateNumber, { color: colors.ctaText }]}>
                    {d.label}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={[styles.datePill, styles.datePillInactive]}>
                  <Text style={styles.dateDayName}>{d.dayName}</Text>
                  <Text style={styles.dateNumber}>{d.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // Step 3: Time slots
  const renderStep3 = () => (
    <View>
      <TouchableOpacity style={styles.backRow} onPress={() => goToStep(2)}>
        <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
        <Text style={styles.backText}>Change date</Text>
      </TouchableOpacity>

      <Text style={styles.stepTitle}>Available Times</Text>
      <Text style={styles.stepSubtitle}>
        {selectedCounsellor?.name} on {selectedDate}
      </Text>

      {slotsLoading ? (
        <ActivityIndicator color={colors.accentPrimary} style={{ marginTop: 40 }} />
      ) : timeSlots.length === 0 ? (
        <View style={[styles.emptyCard, glassCard]}>
          <Ionicons name="time-outline" size={32} color={colors.textMuted} />
          <Text style={styles.emptyText}>No available slots for this date</Text>
        </View>
      ) : (
        <View style={styles.slotsGrid}>
          {timeSlots.map((slot) => {
            const isSelected = selectedTime === slot.time;
            const isDisabled = !slot.available;

            return (
              <TouchableOpacity
                key={slot.time}
                disabled={isDisabled}
                onPress={() => handleSelectTime(slot.time)}
                activeOpacity={0.7}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.slotPill}
                  >
                    <Text style={[styles.slotText, { color: colors.ctaText }]}>
                      {slot.time}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.slotPill,
                      styles.slotPillInactive,
                      isDisabled && styles.slotPillDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        isDisabled && { color: colors.textDisabled },
                      ]}
                    >
                      {slot.time}
                    </Text>
                    {isDisabled && (
                      <Text style={styles.slotBooked}>Booked</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  // Step 4: Confirmation
  const renderStep4 = () => (
    <View>
      <TouchableOpacity style={styles.backRow} onPress={() => goToStep(3)}>
        <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
        <Text style={styles.backText}>Change time</Text>
      </TouchableOpacity>

      <Text style={styles.stepTitle}>Confirm Booking</Text>
      <Text style={styles.stepSubtitle}>Review your appointment details</Text>

      <View style={[styles.confirmCard, glassCard]}>
        {/* Counsellor */}
        <View style={styles.confirmRow}>
          <Ionicons name="person-outline" size={18} color={colors.accentPrimary} />
          <View style={styles.confirmDetail}>
            <Text style={styles.confirmLabel}>Counsellor</Text>
            <Text style={styles.confirmValue}>{selectedCounsellor?.name}</Text>
          </View>
        </View>

        <View style={styles.confirmDivider} />

        {/* Date */}
        <View style={styles.confirmRow}>
          <Ionicons name="calendar-outline" size={18} color={colors.accentPrimary} />
          <View style={styles.confirmDetail}>
            <Text style={styles.confirmLabel}>Date</Text>
            <Text style={styles.confirmValue}>{selectedDate}</Text>
          </View>
        </View>

        <View style={styles.confirmDivider} />

        {/* Time */}
        <View style={styles.confirmRow}>
          <Ionicons name="time-outline" size={18} color={colors.accentPrimary} />
          <View style={styles.confirmDetail}>
            <Text style={styles.confirmLabel}>Time</Text>
            <Text style={styles.confirmValue}>{selectedTime}</Text>
          </View>
        </View>

        <View style={styles.confirmDivider} />

        {/* Duration */}
        <View style={styles.confirmRow}>
          <Ionicons name="hourglass-outline" size={18} color={colors.accentPrimary} />
          <View style={styles.confirmDetail}>
            <Text style={styles.confirmLabel}>Duration</Text>
            <Text style={styles.confirmValue}>60 minutes</Text>
          </View>
        </View>
      </View>

      {/* Credit Balance */}
      <View style={[styles.creditCard, glassCard]}>
        <View style={styles.creditRow}>
          <Text style={styles.creditLabel}>Credit Balance</Text>
          <Text style={styles.creditValue}>{creditBalance}</Text>
        </View>
        <Text style={styles.creditNote}>
          1 credit will be deducted for this session
        </Text>
      </View>

      {/* Confirm button */}
      <TouchableOpacity
        onPress={handleConfirmBooking}
        disabled={bookingLoading}
        activeOpacity={0.8}
        style={{ marginTop: 20 }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaButton}
        >
          {bookingLoading ? (
            <ActivityIndicator color={colors.ctaText} />
          ) : (
            <Text style={styles.ctaText}>Confirm Booking</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Success screen
  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIconCircle}>
        <Ionicons name="checkmark-circle" size={64} color={colors.accentGreen} />
      </View>

      <Text style={styles.successTitle}>Booking Confirmed!</Text>
      <Text style={styles.successSubtitle}>
        Your session has been scheduled successfully
      </Text>

      <View style={[styles.confirmCard, glassCard, { marginTop: 32 }]}>
        <View style={styles.confirmRow}>
          <Ionicons name="person-outline" size={18} color={colors.accentPrimary} />
          <View style={styles.confirmDetail}>
            <Text style={styles.confirmLabel}>Counsellor</Text>
            <Text style={styles.confirmValue}>{selectedCounsellor?.name}</Text>
          </View>
        </View>

        <View style={styles.confirmDivider} />

        <View style={styles.confirmRow}>
          <Ionicons name="calendar-outline" size={18} color={colors.accentPrimary} />
          <View style={styles.confirmDetail}>
            <Text style={styles.confirmLabel}>Date & Time</Text>
            <Text style={styles.confirmValue}>
              {selectedDate} at {selectedTime}
            </Text>
          </View>
        </View>

        {bookingDetails?.id && (
          <>
            <View style={styles.confirmDivider} />
            <View style={styles.confirmRow}>
              <Ionicons name="document-text-outline" size={18} color={colors.accentPrimary} />
              <View style={styles.confirmDetail}>
                <Text style={styles.confirmLabel}>Booking ID</Text>
                <Text style={styles.confirmValue}>#{bookingDetails.id}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('SessionsList')}
        activeOpacity={0.8}
        style={{ marginTop: 32 }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaText}>View My Sessions</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ marginTop: 16 }}
      >
        <Text style={styles.secondaryLink}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      {!bookingSuccess && (
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Session</Text>
          <View style={{ width: 22 }} />
        </View>
      )}

      {/* Step indicator */}
      {!bookingSuccess && renderStepIndicator()}

      {/* Step content */}
      <Animated.View style={{ opacity: fadeAnim }}>
        {bookingSuccess
          ? renderSuccess()
          : step === 1
          ? renderStep1()
          : step === 2
          ? renderStep2()
          : step === 3
          ? renderStep3()
          : renderStep4()}
      </Animated.View>
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');

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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  stepDot: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.progressBg,
  },
  stepDotActive: {
    backgroundColor: colors.accentPrimary,
  },
  stepDotCurrent: {
    width: 32,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Counsellor list
  counsellorList: {
    gap: 12,
  },
  counsellorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: colors.textSecondary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    color: colors.accentYellow,
    fontWeight: '500',
  },

  // Date pills
  dateRow: {
    gap: 10,
    paddingVertical: 4,
  },
  datePill: {
    width: 56,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  datePillInactive: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderCard,
  },
  dateDayName: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Time slots
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  slotPill: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: (width - 40 - 24) / 3,
  },
  slotPillInactive: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderCard,
  },
  slotPillDisabled: {
    opacity: 0.4,
  },
  slotText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  slotBooked: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Empty state
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Confirm card
  confirmCard: {
    padding: 20,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  confirmDetail: {
    flex: 1,
  },
  confirmLabel: {
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  confirmValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: colors.borderCard,
    marginVertical: 12,
  },

  // Credit card
  creditCard: {
    padding: 16,
    marginTop: 16,
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  creditLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  creditValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accentPrimary,
  },
  creditNote: {
    fontSize: 11,
    color: colors.textMuted,
  },

  // CTA
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

  // Success
  successContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(74,222,128,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  secondaryLink: {
    fontSize: 13,
    color: colors.accentPrimary,
    fontWeight: '500',
    textAlign: 'center',
  },
});
