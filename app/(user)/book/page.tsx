"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Star,
  Calendar,
  Clock,
  CheckCircle2,
  Loader2,
  CreditCard,
  Video,
  MapPin,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { listCounsellorsApi } from "@/lib/counsellors";
import { getAvailabilityApi, bookConsultationApi } from "@/lib/consultations";

interface CounsellorTag {
  id: number;
  name: string;
}

interface Counsellor {
  id: number;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  photo: string | null;
  tags: CounsellorTag[];
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
}

const AVATAR_COLORS = [
  "#6FFFE9", "#A78BFA", "#FF6B6B", "#FFD93D", "#5BC0BE", "#4ADE80",
];

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getNext7Days(): { label: string; date: string; dayName: string }[] {
  const days: { label: string; date: string; dayName: string }[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    days.push({
      label: `${monthNames[d.getMonth()]} ${d.getDate()}`,
      date: `${yyyy}-${mm}-${dd}`,
      dayName: i === 0 ? "Today" : i === 1 ? "Tomorrow" : dayNames[d.getDay()],
    });
  }
  return days;
}

export default function BookPage() {
  const { memberships, selectedOrg } = useAuthStore();

  // Step tracking: 1=counsellors, 2=date, 3=time, 4=confirm, 5=success
  const [step, setStep] = useState(1);

  // Data
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Selections
  const [selectedCounsellor, setSelectedCounsellor] = useState<Counsellor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [consultationType, setConsultationType] = useState<"IN_PERSON" | "VIDEO">("IN_PERSON");

  // Availability
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Booking
  const [booking, setBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Credit balance
  const activeMembership = memberships.find(
    (m) => m.organization.id === selectedOrg?.id
  );
  const creditBalance = activeMembership?.creditBalance ?? 0;
  const orgId = selectedOrg?.id;

  const dates = getNext7Days();

  useEffect(() => {
    fetchCounsellors();
  }, []);

  async function fetchCounsellors() {
    try {
      setLoading(true);
      setError("");
      const res = await listCounsellorsApi();
      setCounsellors(res.data || []);
    } catch {
      setError("Failed to load counsellors");
    } finally {
      setLoading(false);
    }
  }

  const fetchAvailability = useCallback(async (counsellorId: number, date: string) => {
    try {
      setLoadingSlots(true);
      setTimeSlots([]);
      const res = await getAvailabilityApi(counsellorId, date);
      setTimeSlots(res.data || []);
    } catch {
      setTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  function handleSelectCounsellor(c: Counsellor) {
    setSelectedCounsellor(c);
    setSelectedDate("");
    setSelectedTime(null);
    setStep(2);
  }

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setSelectedTime(null);
    if (selectedCounsellor) {
      fetchAvailability(selectedCounsellor.id, date);
    }
    setStep(3);
  }

  function handleSelectTime(slot: TimeSlot) {
    setSelectedTime(slot);
    setStep(4);
  }

  async function handleBook() {
    if (!selectedCounsellor || !selectedDate || !selectedTime || !orgId) return;
    try {
      setBooking(true);
      setError("");
      const res = await bookConsultationApi(
        {
          counsellorId: selectedCounsellor.id,
          date: selectedDate,
          time: selectedTime.startTime,
          type: consultationType,
        },
        orgId
      );
      setBookingResult(res.data);
      setStep(5);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to book consultation");
    } finally {
      setBooking(false);
    }
  }

  function handleBack() {
    if (step === 2) {
      setSelectedCounsellor(null);
      setStep(1);
    } else if (step === 3) {
      setSelectedDate("");
      setSelectedTime(null);
      setStep(2);
    } else if (step === 4) {
      setSelectedTime(null);
      setStep(3);
    }
  }

  function handleReset() {
    setStep(1);
    setSelectedCounsellor(null);
    setSelectedDate("");
    setSelectedTime(null);
    setBookingResult(null);
    setError("");
  }

  // --- Success Screen ---
  if (step === 5 && bookingResult) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: "var(--tag-bg)" }}
        >
          <CheckCircle2 size={40} style={{ color: "var(--accent-primary)" }} />
        </div>
        <h1
          className="font-heading text-[24px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Booking Confirmed!
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
          Your session with {bookingResult.counsellor?.name} has been booked
        </p>

        <div className="glass-card mt-6 w-full max-w-[320px] p-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={14} style={{ color: "var(--accent-primary)" }} />
              <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                {new Date(bookingResult.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: "var(--accent-primary)" }} />
              <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                {bookingResult.time} &middot; {bookingResult.duration} min
              </span>
            </div>
            <div className="flex items-center gap-2">
              {bookingResult.type === "VIDEO" ? (
                <Video size={14} style={{ color: "var(--accent-primary)" }} />
              ) : (
                <MapPin size={14} style={{ color: "var(--accent-primary)" }} />
              )}
              <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                {bookingResult.type === "VIDEO" ? "Video Call" : "In Person"}
              </span>
            </div>
          </div>
        </div>

        <button className="cta-button mt-8 max-w-[280px]" onClick={handleReset}>
          Book Another Session
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button onClick={handleBack} className="p-1">
              <ArrowLeft size={18} style={{ color: "var(--text-muted)" }} />
            </button>
          )}
          <div>
            <h1
              className="font-heading text-[22px] font-semibold leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Book a Session<span style={{ color: "var(--accent-primary)" }}>.</span>
            </h1>
            <p className="mt-0.5 text-[12px]" style={{ color: "var(--text-muted)" }}>
              {step === 1 && "Choose a counsellor"}
              {step === 2 && "Select a date"}
              {step === 3 && "Pick a time slot"}
              {step === 4 && "Confirm your booking"}
            </p>
          </div>
        </div>

        {/* Credit balance */}
        <div
          className="glass-card flex items-center gap-2 px-3 py-2"
        >
          <CreditCard size={14} style={{ color: "var(--accent-primary)" }} />
          <span className="text-[12px] font-semibold" style={{ color: "var(--accent-primary)" }}>
            {creditBalance}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            credits
          </span>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-4 flex gap-1">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className="h-[3px] flex-1 rounded-full transition-all"
            style={{
              background: s <= step ? "var(--gradient-cta)" : "var(--progress-bg)",
            }}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card mt-4 p-3 text-center">
          <p className="text-[12px]" style={{ color: "#FF6B6B" }}>{error}</p>
        </div>
      )}

      {/* Step 1: Counsellor List */}
      {step === 1 && (
        <div className="mt-5">
          {loading && (
            <div className="mt-12 flex justify-center">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
            </div>
          )}

          {!loading && counsellors.length === 0 && (
            <div className="mt-12 flex flex-col items-center">
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                No counsellors available
              </p>
            </div>
          )}

          {!loading && (
            <div className="flex flex-col gap-3">
              {counsellors.map((c, index) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCounsellor(c)}
                  className="glass-card w-full p-4 text-left transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-[48px] w-[48px] flex-shrink-0 items-center justify-center rounded-icon text-[16px] font-bold"
                      style={{
                        background: `${getAvatarColor(index)}20`,
                        color: getAvatarColor(index),
                      }}
                    >
                      {c.photo ? (
                        <img src={c.photo} alt={c.name} className="h-full w-full rounded-icon object-cover" />
                      ) : (
                        getInitials(c.name)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {c.name}
                      </p>
                      <p className="mt-[2px] text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {c.specialization} &middot; {c.experience} yrs
                      </p>
                      <div className="mt-1 flex items-center gap-1">
                        <Star size={11} fill="#FFD93D" stroke="#FFD93D" />
                        <span className="text-[11px] font-medium" style={{ color: "#FFD93D" }}>
                          {c.rating.toFixed(1)}
                        </span>
                      </div>
                      {c.tags && c.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-[6px]">
                          {c.tags.map((t) => (
                            <span key={t.id} className="tag" style={{ fontSize: "9px" }}>
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Date Selection */}
      {step === 2 && selectedCounsellor && (
        <div className="mt-5">
          {/* Selected counsellor summary */}
          <div className="glass-card flex items-center gap-3 p-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-icon text-[14px] font-bold"
              style={{
                background: "var(--tag-bg)",
                color: "var(--accent-primary)",
              }}
            >
              {getInitials(selectedCounsellor.name)}
            </div>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                {selectedCounsellor.name}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {selectedCounsellor.specialization}
              </p>
            </div>
          </div>

          <p
            className="mt-5 text-[11px] font-medium uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Select a Date
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {dates.map((d) => (
              <button
                key={d.date}
                onClick={() => handleSelectDate(d.date)}
                className={`flex flex-col items-center rounded-[16px] px-4 py-3 transition-all ${
                  selectedDate === d.date ? "pill-active" : ""
                }`}
                style={
                  selectedDate !== d.date
                    ? {
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-card)",
                      }
                    : undefined
                }
              >
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: selectedDate === d.date ? "#0B0C10" : "var(--text-muted)",
                  }}
                >
                  {d.dayName}
                </span>
                <span
                  className="mt-1 text-[13px] font-semibold"
                  style={{
                    color: selectedDate === d.date ? "#0B0C10" : "var(--text-primary)",
                  }}
                >
                  {d.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Time Selection */}
      {step === 3 && selectedCounsellor && selectedDate && (
        <div className="mt-5">
          {/* Context */}
          <div className="glass-card flex items-center gap-3 p-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-icon text-[14px] font-bold"
              style={{
                background: "var(--tag-bg)",
                color: "var(--accent-primary)",
              }}
            >
              {getInitials(selectedCounsellor.name)}
            </div>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                {selectedCounsellor.name}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Consultation type toggle */}
          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setConsultationType("IN_PERSON")}
              className={consultationType === "IN_PERSON" ? "pill-active" : "pill-inactive"}
            >
              <MapPin size={12} className="mr-1 inline" /> In Person
            </button>
            <button
              onClick={() => setConsultationType("VIDEO")}
              className={consultationType === "VIDEO" ? "pill-active" : "pill-inactive"}
            >
              <Video size={12} className="mr-1 inline" /> Video Call
            </button>
          </div>

          <p
            className="mt-5 text-[11px] font-medium uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Available Time Slots
          </p>

          {loadingSlots && (
            <div className="mt-8 flex justify-center">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
            </div>
          )}

          {!loadingSlots && timeSlots.length === 0 && (
            <div className="mt-8 text-center">
              <Clock size={32} style={{ color: "var(--text-muted)", margin: "0 auto" }} />
              <p className="mt-3 text-[13px]" style={{ color: "var(--text-muted)" }}>
                No available slots for this date
              </p>
              <button
                onClick={() => setStep(2)}
                className="mt-3 text-[12px] font-medium"
                style={{ color: "var(--accent-primary)" }}
              >
                Choose another date
              </button>
            </div>
          )}

          {!loadingSlots && timeSlots.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.startTime}
                  onClick={() => handleSelectTime(slot)}
                  className={`rounded-[16px] px-4 py-3 text-[13px] font-medium transition-all ${
                    selectedTime?.startTime === slot.startTime ? "pill-active" : ""
                  }`}
                  style={
                    selectedTime?.startTime !== slot.startTime
                      ? {
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-card)",
                          color: "var(--text-primary)",
                        }
                      : undefined
                  }
                >
                  {slot.startTime}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && selectedCounsellor && selectedDate && selectedTime && (
        <div className="mt-5">
          <div className="glass-card p-5">
            <p
              className="text-center text-[11px] font-medium uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Booking Summary
            </p>

            <div className="mt-4 flex flex-col items-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-icon text-[20px] font-bold"
                style={{
                  background: "var(--tag-bg)",
                  color: "var(--accent-primary)",
                }}
              >
                {getInitials(selectedCounsellor.name)}
              </div>
              <p
                className="mt-3 font-heading text-[18px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {selectedCounsellor.name}
              </p>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                {selectedCounsellor.specialization}
              </p>
            </div>

            <div
              className="mt-5 rounded-[14px] p-4"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
              }}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Calendar size={14} style={{ color: "var(--accent-primary)" }} />
                  <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={14} style={{ color: "var(--accent-primary)" }} />
                  <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                    {selectedTime.startTime} - {selectedTime.endTime} ({selectedTime.duration} min)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {consultationType === "VIDEO" ? (
                    <Video size={14} style={{ color: "var(--accent-primary)" }} />
                  ) : (
                    <MapPin size={14} style={{ color: "var(--accent-primary)" }} />
                  )}
                  <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                    {consultationType === "VIDEO" ? "Video Call" : "In Person"}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="mt-4 flex items-center justify-center gap-2 rounded-[14px] p-3"
              style={{
                background: "rgba(111,255,233,0.08)",
                border: "1px solid rgba(111,255,233,0.15)",
              }}
            >
              <CreditCard size={14} style={{ color: "var(--accent-primary)" }} />
              <span className="text-[12px] font-medium" style={{ color: "var(--accent-primary)" }}>
                1 credit will be used
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                ({creditBalance} available)
              </span>
            </div>
          </div>

          <button
            className="cta-button mt-5 flex items-center justify-center gap-2"
            onClick={handleBook}
            disabled={booking || creditBalance < 1}
          >
            {booking ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            {booking ? "Booking..." : "Confirm Booking"}
          </button>

          {creditBalance < 1 && (
            <p className="mt-3 text-center text-[11px]" style={{ color: "#FF6B6B" }}>
              Insufficient credits. Please contact your organization admin.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
