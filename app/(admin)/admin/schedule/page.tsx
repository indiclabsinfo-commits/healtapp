"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { useAuthStore } from "@/stores/auth-store";
import {
  getCounsellorConsultationsApi,
  getCounsellorSlotsApi,
  setCounsellorSlotsApi,
  updateConsultationNotesApi,
  updateConsultationStatusApi,
} from "@/lib/consultations";
import { listCounsellorsApi } from "@/lib/counsellors";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Video,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  Sparkles,
  ArrowRight,
  BookOpen,
  Heart,
  User,
  X,
  Settings,
  Plus,
  Trash2,
} from "lucide-react";

interface ConsultationUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
}

interface Consultation {
  id: number;
  userId: number;
  user: ConsultationUser;
  counsellorId: number;
  date: string;
  time: string;
  duration: number;
  status: "BOOKED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  type: string;
  notes: string | null;
  summary: string | null;
  createdAt: string;
}

interface Counsellor {
  id: number;
  name: string;
  specialization: string;
}

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MOOD_OPTIONS = [
  { value: "GREAT", label: "Great", emoji: "😄", color: "#4ADE80" },
  { value: "GOOD", label: "Good", emoji: "🙂", color: "#6FFFE9" },
  { value: "NEUTRAL", label: "Neutral", emoji: "😐", color: "#FFD93D" },
  { value: "LOW", label: "Low", emoji: "😔", color: "#F97316" },
  { value: "STRUGGLING", label: "Struggling", emoji: "😰", color: "#FF6B6B" },
];

const NEXT_STEPS_OPTIONS = [
  "Continue current plan",
  "Increase session frequency",
  "Reduce session frequency",
  "Refer to psychiatrist",
  "Refer to group therapy",
  "Complete assessment",
  "Homework assignment",
  "Crisis support referral",
];

const QUICK_SUGGESTIONS = [
  { label: "Follow up next week", icon: Calendar, color: "#6FFFE9" },
  { label: "Breathing exercises", icon: Heart, color: "#F472B6" },
  { label: "Journaling practice", icon: BookOpen, color: "#A78BFA" },
  { label: "Group session", icon: MessageSquare, color: "#FFD93D" },
];

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
}

function isToday(d: Date): boolean {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

const DAY_NAMES_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DURATIONS = [30, 45, 60, 90];

interface DayConfig {
  enabled: boolean;
  start: string;
  end: string;
  duration: number;
}

const DEFAULT_DAY_CONFIG: DayConfig = { enabled: false, start: "09:00", end: "17:00", duration: 60 };

function generateSlotsForDay(dayOfWeek: number, cfg: DayConfig) {
  const result: { dayOfWeek: number; startTime: string; endTime: string; duration: number }[] = [];
  let [h, m] = cfg.start.split(":").map(Number);
  const [eh, em] = cfg.end.split(":").map(Number);
  const endMins = eh * 60 + em;
  while (h * 60 + m + cfg.duration <= endMins) {
    const startTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const nm = m + cfg.duration;
    const nh = h + Math.floor(nm / 60);
    const endTime = `${String(nh).padStart(2, "0")}:${String(nm % 60).padStart(2, "0")}`;
    result.push({ dayOfWeek, startTime, endTime, duration: cfg.duration });
    h = nh;
    m = nm % 60;
  }
  return result;
}

function slotMatchesConsultation(c: Consultation, slotTime: string): boolean {
  const [ch, cm] = c.time.split(":").map(Number);
  const [sh, sm] = slotTime.split(":").map(Number);
  return ch === sh && cm === sm;
}

export default function AdminSchedulePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [selectedCounsellorId, setSelectedCounsellorId] = useState<number | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Week navigation
  const [weekBase, setWeekBase] = useState<Date>(new Date());
  const weekDates = getWeekDates(weekBase);

  // Selected slot / session
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  // Availability modal state
  const [showAvailModal, setShowAvailModal] = useState(false);
  const [availConfig, setAvailConfig] = useState<DayConfig[]>(
    Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY_CONFIG }))
  );
  const [savingAvail, setSavingAvail] = useState(false);
  const [availError, setAvailError] = useState("");

  // Session detail state
  const [sessionNotes, setSessionNotes] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedNextStep, setSelectedNextStep] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCounsellors();
  }, []);

  useEffect(() => {
    if (selectedCounsellorId) {
      fetchConsultations(selectedCounsellorId);
    }
  }, [selectedCounsellorId]);

  useEffect(() => {
    if (selectedConsultation) {
      setSessionNotes(selectedConsultation.notes || "");
      setSelectedMood("");
      setSelectedNextStep("");
    }
  }, [selectedConsultation]);

  async function fetchCounsellors() {
    try {
      const res = await listCounsellorsApi({ limit: 100 });
      const list: Counsellor[] = res.data || [];
      setCounsellors(list);
      if (list.length > 0) {
        const matchByName = user?.name
          ? list.find(
              (c) =>
                c.name.toLowerCase().includes(user.name.toLowerCase()) ||
                user.name.toLowerCase().includes(c.name.toLowerCase())
            )
          : null;
        setSelectedCounsellorId(matchByName?.id || list[0].id);
      }
    } catch {
      setError("Failed to load counsellors");
    } finally {
      setLoading(false);
    }
  }

  async function fetchConsultations(counsellorId: number) {
    setLoading(true);
    try {
      const res = await getCounsellorConsultationsApi(counsellorId, { limit: 200 });
      setConsultations(res.data || []);
    } catch {
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  }

  async function openAvailModal() {
    if (!selectedCounsellorId) return;
    setAvailError("");
    const freshConfig: DayConfig[] = Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY_CONFIG }));
    try {
      const res = await getCounsellorSlotsApi(selectedCounsellorId);
      const existing: { dayOfWeek: number; startTime: string; endTime: string; duration: number }[] = res.data || [];
      // For each day, take the first and last slot to reconstruct the range
      existing.forEach((slot) => {
        const d = slot.dayOfWeek;
        if (!freshConfig[d].enabled) {
          freshConfig[d].enabled = true;
          freshConfig[d].start = slot.startTime;
          freshConfig[d].end = slot.endTime;
          freshConfig[d].duration = slot.duration;
        } else {
          // Extend end time to cover last slot
          if (slot.endTime > freshConfig[d].end) freshConfig[d].end = slot.endTime;
        }
      });
    } catch {
      // start fresh if fetch fails
    }
    setAvailConfig(freshConfig);
    setShowAvailModal(true);
  }

  async function saveAvailability() {
    if (!selectedCounsellorId) return;
    setSavingAvail(true);
    setAvailError("");
    try {
      const allSlots = availConfig.flatMap((cfg, dayIdx) =>
        cfg.enabled ? generateSlotsForDay(dayIdx, cfg) : []
      );
      await setCounsellorSlotsApi(selectedCounsellorId, allSlots);
      setShowAvailModal(false);
    } catch (err: any) {
      setAvailError(err.response?.data?.error || "Failed to save availability");
    } finally {
      setSavingAvail(false);
    }
  }

  function getSlotConsultation(date: Date, slot: string): Consultation | null {
    const dateKey = formatDateKey(date);
    return (
      consultations.find(
        (c) =>
          c.date.slice(0, 10) === dateKey &&
          slotMatchesConsultation(c, slot) &&
          c.status === "BOOKED"
      ) || null
    );
  }

  function getAvailabilityForDay(date: Date): { total: number; booked: number } {
    const dateKey = formatDateKey(date);
    const booked = consultations.filter(
      (c) => c.date.slice(0, 10) === dateKey && c.status === "BOOKED"
    ).length;
    return { total: TIME_SLOTS.length, booked };
  }

  async function handleComplete() {
    if (!selectedConsultation) return;
    setActionLoading(true);
    try {
      await updateConsultationStatusApi(selectedConsultation.id, "COMPLETED");
      if (sessionNotes || selectedMood) {
        const noteContent = [
          sessionNotes,
          selectedMood ? `Mood: ${selectedMood}` : "",
          selectedNextStep ? `Next: ${selectedNextStep}` : "",
        ]
          .filter(Boolean)
          .join("\n");
        await updateConsultationNotesApi(selectedConsultation.id, { notes: noteContent });
      }
      setConsultations((prev) =>
        prev.map((c) =>
          c.id === selectedConsultation.id
            ? { ...c, status: "COMPLETED", notes: sessionNotes }
            : c
        )
      );
      setSelectedConsultation(null);
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  }

  async function handleNoShow() {
    if (!selectedConsultation) return;
    setActionLoading(true);
    try {
      await updateConsultationStatusApi(selectedConsultation.id, "NO_SHOW");
      setConsultations((prev) =>
        prev.map((c) =>
          c.id === selectedConsultation.id ? { ...c, status: "NO_SHOW" } : c
        )
      );
      setSelectedConsultation(null);
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSaveNotes() {
    if (!selectedConsultation) return;
    setSavingNotes(true);
    try {
      const noteContent = [
        sessionNotes,
        selectedMood ? `Mood: ${selectedMood}` : "",
        selectedNextStep ? `Next: ${selectedNextStep}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      await updateConsultationNotesApi(selectedConsultation.id, { notes: noteContent });
      setConsultations((prev) =>
        prev.map((c) =>
          c.id === selectedConsultation.id ? { ...c, notes: noteContent } : c
        )
      );
    } catch {
      // silent
    } finally {
      setSavingNotes(false);
    }
  }

  const weekLabel = `${weekDates[0].getDate()} ${weekDates[0].toLocaleDateString("en-IN", { month: "short" })} – ${weekDates[6].getDate()} ${weekDates[6].toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`;

  const totalThisWeek = consultations.filter((c) => {
    const d = new Date(c.date);
    return d >= weekDates[0] && d <= weekDates[6] && c.status === "BOOKED";
  }).length;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AdminTopbar title="My Schedule" subtitle="Manage sessions and client calendar" />

      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
        </div>
      )}

      {!loading && (
        <div className="flex flex-1 overflow-hidden">
          {/* ── LEFT PANEL ── */}
          <aside
            className="flex w-64 flex-shrink-0 flex-col overflow-y-auto border-r p-4"
            style={{ borderColor: "var(--border-card)", background: "var(--bg-primary)" }}
          >
            {/* Counsellor selector */}
            {counsellors.length > 1 && (
              <div className="mb-4">
                <p className="mb-1.5 text-[9px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  Counsellor
                </p>
                <div className="flex flex-col gap-1">
                  {counsellors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCounsellorId(c.id)}
                      className="rounded-[10px] px-3 py-2 text-left text-[11px] font-medium transition-all"
                      style={
                        selectedCounsellorId === c.id
                          ? { background: "var(--pill-active-bg)", color: "var(--accent-primary)" }
                          : { background: "transparent", color: "var(--text-secondary)" }
                      }
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Week mini summary */}
            <div
              className="mb-4 rounded-[14px] p-3"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}
            >
              <p className="text-[9px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                This week
              </p>
              <p className="mt-1 font-heading text-[22px] font-bold" style={{ color: "var(--accent-primary)" }}>
                {totalThisWeek}
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>sessions booked</p>
            </div>

            {/* Week navigation */}
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => {
                  const d = new Date(weekBase);
                  d.setDate(d.getDate() - 7);
                  setWeekBase(d);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-[8px] transition-colors hover:bg-[rgba(255,255,255,0.06)]"
                style={{ color: "var(--text-muted)" }}
              >
                <ChevronLeft size={14} />
              </button>
              <p className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>
                {weekLabel}
              </p>
              <button
                onClick={() => {
                  const d = new Date(weekBase);
                  d.setDate(d.getDate() + 7);
                  setWeekBase(d);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-[8px] transition-colors hover:bg-[rgba(255,255,255,0.06)]"
                style={{ color: "var(--text-muted)" }}
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Mini calendar grid */}
            <div className="mb-4">
              <div className="mb-1 grid grid-cols-7 gap-0">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="text-center text-[8px] uppercase tracking-[0.5px]" style={{ color: "var(--text-muted)" }}>
                    {d[0]}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {weekDates.map((d, i) => {
                  const { booked } = getAvailabilityForDay(d);
                  const today = isToday(d);
                  const hasSession = booked > 0;
                  return (
                    <button
                      key={i}
                      onClick={() => setWeekBase(new Date(d))}
                      className="flex flex-col items-center rounded-[8px] py-1.5 transition-all"
                      style={
                        today
                          ? { background: "var(--gradient-cta)", color: "var(--cta-text, #0B0C10)" }
                          : hasSession
                          ? { background: "rgba(111,255,233,0.08)", color: "var(--accent-primary)" }
                          : { background: "transparent", color: "var(--text-secondary)" }
                      }
                    >
                      <span className="text-[11px] font-semibold leading-none">{d.getDate()}</span>
                      {hasSession && !today && (
                        <span
                          className="mt-0.5 h-1 w-1 rounded-full"
                          style={{ background: "var(--accent-primary)" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Set Availability button */}
            <button
              onClick={openAvailModal}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-[12px] py-2.5 text-[11px] font-medium"
              style={{ background: "var(--tag-bg)", color: "var(--accent-primary)", border: "1px solid var(--tag-border)" }}
            >
              <Settings size={12} /> Set Availability
            </button>

            {/* My Availability */}
            <div>
              <p className="mb-2 text-[9px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                My Availability
              </p>
              <div className="space-y-1.5">
                {weekDates.slice(0, 5).map((d, i) => {
                  const { total, booked } = getAvailabilityForDay(d);
                  const available = total - booked;
                  const fullyBooked = available === 0;
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                        {DAY_LABELS[i]}{" "}
                        <span style={{ color: "var(--text-muted)" }}>{d.getDate()}</span>
                      </span>
                      <span
                        className="rounded-pill px-2 py-0.5 text-[9px] font-medium"
                        style={
                          fullyBooked
                            ? { background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }
                            : available <= 2
                            ? { background: "rgba(255,217,61,0.1)", color: "#FFD93D" }
                            : { background: "rgba(74,222,128,0.1)", color: "#4ADE80" }
                        }
                      >
                        {fullyBooked ? "Full" : `${available} open`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ── MIDDLE PANEL — WEEKLY GRID ── */}
          <main className="flex flex-1 flex-col overflow-hidden">
            {/* Grid header */}
            <div
              className="flex items-center justify-between border-b px-4 py-3"
              style={{ borderColor: "var(--border-card)" }}
            >
              <div>
                <h2 className="font-heading text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Manage Calendar
                </h2>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {weekLabel}
                </p>
              </div>
              <button
                onClick={() => setWeekBase(new Date())}
                className="rounded-pill px-3 py-1.5 text-[10px] font-medium"
                style={{ background: "var(--tag-bg)", color: "var(--accent-primary)", border: "1px solid var(--tag-border)" }}
              >
                Today
              </button>
            </div>

            {/* Grid body */}
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th
                      className="w-16 border-b border-r px-2 py-2 text-[9px] font-normal uppercase tracking-[1px]"
                      style={{ color: "var(--text-muted)", borderColor: "var(--border-card)" }}
                    >
                      Time
                    </th>
                    {weekDates.map((d, i) => {
                      const today = isToday(d);
                      return (
                        <th
                          key={i}
                          className="border-b border-r px-2 py-2 text-center"
                          style={{ borderColor: "var(--border-card)" }}
                        >
                          <div
                            className="inline-flex flex-col items-center rounded-[10px] px-3 py-1"
                            style={
                              today
                                ? { background: "var(--gradient-cta)" }
                                : { background: "transparent" }
                            }
                          >
                            <span
                              className="text-[9px] uppercase tracking-[0.5px]"
                              style={{ color: today ? "var(--cta-text, #0B0C10)" : "var(--text-muted)" }}
                            >
                              {DAY_LABELS[i]}
                            </span>
                            <span
                              className="text-[13px] font-bold leading-none"
                              style={{ color: today ? "var(--cta-text, #0B0C10)" : "var(--text-primary)" }}
                            >
                              {d.getDate()}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot) => (
                    <tr key={slot}>
                      <td
                        className="border-b border-r px-2 py-1 text-right text-[9px]"
                        style={{ color: "var(--text-muted)", borderColor: "var(--border-card)", verticalAlign: "top", paddingTop: "10px" }}
                      >
                        {formatTime(slot)}
                      </td>
                      {weekDates.map((d, di) => {
                        const consultation = getSlotConsultation(d, slot);
                        const isPast = new Date(`${formatDateKey(d)}T${slot}`) < new Date();

                        return (
                          <td
                            key={di}
                            className="border-b border-r p-1"
                            style={{ borderColor: "var(--border-card)", height: "52px" }}
                          >
                            {consultation ? (
                              <button
                                onClick={() => setSelectedConsultation(consultation)}
                                className="h-full w-full rounded-[10px] px-2 py-1.5 text-left transition-all hover:opacity-90"
                                style={{
                                  background:
                                    selectedConsultation?.id === consultation.id
                                      ? "var(--gradient-cta)"
                                      : "rgba(111,255,233,0.12)",
                                  border: `1px solid ${
                                    selectedConsultation?.id === consultation.id
                                      ? "transparent"
                                      : "rgba(111,255,233,0.2)"
                                  }`,
                                }}
                              >
                                <p
                                  className="truncate text-[10px] font-semibold leading-tight"
                                  style={{
                                    color:
                                      selectedConsultation?.id === consultation.id
                                        ? "var(--cta-text, #0B0C10)"
                                        : "var(--accent-primary)",
                                  }}
                                >
                                  {consultation.user.name.split(" ")[0]}
                                </p>
                                <p
                                  className="text-[8px] leading-tight"
                                  style={{
                                    color:
                                      selectedConsultation?.id === consultation.id
                                        ? "rgba(11,12,16,0.6)"
                                        : "var(--text-muted)",
                                  }}
                                >
                                  {consultation.duration}m · {consultation.type === "VIDEO" ? "Video" : "In-person"}
                                </p>
                              </button>
                            ) : (
                              <div
                                className="h-full w-full rounded-[8px]"
                                style={{
                                  background: isPast
                                    ? "transparent"
                                    : "rgba(255,255,255,0.01)",
                                  border: isPast ? "none" : "1px dashed rgba(255,255,255,0.04)",
                                }}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Legend */}
              <div className="flex items-center gap-4 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "rgba(111,255,233,0.12)", border: "1px solid rgba(111,255,233,0.2)" }} />
                  <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>Scheduled</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "transparent", border: "1px dashed rgba(255,255,255,0.04)" }} />
                  <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>Available</span>
                </div>
              </div>
            </div>
          </main>

          {/* ── RIGHT PANEL — SESSION DETAILS ── */}
          <aside
            className="w-72 flex-shrink-0 overflow-y-auto border-l"
            style={{ borderColor: "var(--border-card)", background: "var(--bg-primary)" }}
          >
            {!selectedConsultation ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px]"
                  style={{ background: "var(--bg-card)" }}
                >
                  <Calendar size={22} style={{ color: "var(--text-muted)" }} />
                </div>
                <p className="text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>
                  Select a session
                </p>
                <p className="mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Click any scheduled slot to view details and add notes
                </p>
              </div>
            ) : (
              <div className="p-4">
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-[9px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                      Session Details
                    </p>
                    <h3 className="mt-0.5 font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      {selectedConsultation.user.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedConsultation(null)}
                    className="flex h-7 w-7 items-center justify-center rounded-[8px]"
                    style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Student card */}
                <div
                  className="mb-4 rounded-[14px] p-3"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] text-[13px] font-bold"
                      style={{ background: "var(--gradient-cta)", color: "var(--cta-text, #0B0C10)" }}
                    >
                      {selectedConsultation.user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {selectedConsultation.user.name}
                      </p>
                      <p className="truncate text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {selectedConsultation.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={10} style={{ color: "var(--text-muted)" }} />
                      <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                        {new Date(selectedConsultation.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={10} style={{ color: "var(--text-muted)" }} />
                      <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                        {formatTime(selectedConsultation.time)} · {selectedConsultation.duration}m
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {selectedConsultation.type === "VIDEO" ? (
                        <Video size={10} style={{ color: "var(--text-muted)" }} />
                      ) : (
                        <MapPin size={10} style={{ color: "var(--text-muted)" }} />
                      )}
                      <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                        {selectedConsultation.type === "VIDEO" ? "Video Call" : "In Person"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/admin/clients/${selectedConsultation.user.id}`)}
                    className="mt-3 flex items-center gap-1 text-[10px] font-medium"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    View Full Profile <ArrowRight size={10} />
                  </button>
                </div>

                {/* Current Mood */}
                <div className="mb-3">
                  <p className="mb-1.5 text-[9px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                    Current Mood
                  </p>
                  <div className="flex gap-1.5">
                    {MOOD_OPTIONS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setSelectedMood(selectedMood === m.value ? "" : m.value)}
                        className="flex flex-1 flex-col items-center rounded-[10px] py-2 transition-all"
                        title={m.label}
                        style={
                          selectedMood === m.value
                            ? { background: `${m.color}20`, border: `1px solid ${m.color}40` }
                            : { background: "var(--bg-card)", border: "1px solid var(--border-card)" }
                        }
                      >
                        <span className="text-[14px]">{m.emoji}</span>
                        <span className="mt-0.5 text-[7px]" style={{ color: selectedMood === m.value ? m.color : "var(--text-muted)" }}>
                          {m.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Next Steps */}
                <div className="mb-3">
                  <p className="mb-1.5 text-[9px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                    Next Steps
                  </p>
                  <select
                    value={selectedNextStep}
                    onChange={(e) => setSelectedNextStep(e.target.value)}
                    className="input-field w-full text-[11px]"
                    style={{ padding: "10px 12px" }}
                  >
                    <option value="">Select next step...</option>
                    {NEXT_STEPS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Session Notes */}
                <div className="mb-3">
                  <p className="mb-1.5 text-[9px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                    Session Notes
                  </p>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    rows={4}
                    className="input-field w-full resize-none text-[11px]"
                    style={{ padding: "10px 12px" }}
                    placeholder="Key observations, client feedback, plan for next session..."
                  />
                </div>

                {/* Save notes */}
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-[12px] py-2.5 text-[11px] font-medium transition-all"
                  style={{
                    background: "var(--tag-bg)",
                    color: "var(--accent-primary)",
                    border: "1px solid var(--tag-border)",
                  }}
                >
                  {savingNotes ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                  {savingNotes ? "Saving..." : "Save Notes"}
                </button>

                {/* Quick Suggestions */}
                <div className="mb-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Sparkles size={10} style={{ color: "var(--accent-primary)" }} />
                    <p className="text-[9px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                      Quick Suggestions
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUICK_SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => setSessionNotes((prev) => (prev ? prev + "\n• " + s.label : "• " + s.label))}
                        className="flex flex-col items-start rounded-[10px] p-2 text-left transition-all hover:opacity-80"
                        style={{ background: `${s.color}10`, border: `1px solid ${s.color}20` }}
                      >
                        <s.icon size={12} style={{ color: s.color, marginBottom: "4px" }} />
                        <span className="text-[9px] font-medium leading-tight" style={{ color: s.color }}>
                          {s.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                {selectedConsultation.status === "BOOKED" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleNoShow}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-1 rounded-[12px] py-2.5 text-[10px] font-medium transition-all"
                      style={{
                        background: "rgba(255,217,61,0.1)",
                        color: "#FFD93D",
                        border: "1px solid rgba(255,217,61,0.2)",
                      }}
                    >
                      <AlertCircle size={11} />
                      No Show
                    </button>
                    <button
                      onClick={handleComplete}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-1 rounded-[12px] py-2.5 text-[10px] font-medium transition-all"
                      style={{
                        background: "var(--gradient-cta)",
                        color: "var(--cta-text, #0B0C10)",
                      }}
                    >
                      {actionLoading ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={11} />
                      )}
                      Complete
                    </button>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ── AVAILABILITY MODAL ── */}
      {showAvailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-full max-w-lg rounded-[20px] p-6"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-card)", maxHeight: "90vh", overflowY: "auto" }}
          >
            {/* Modal header */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-[17px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Set Availability
                </h2>
                <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {counsellors.find((c) => c.id === selectedCounsellorId)?.name} · weekly recurring schedule
                </p>
              </div>
              <button
                onClick={() => setShowAvailModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-[10px]"
                style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Day rows */}
            <div className="space-y-3">
              {DAY_NAMES_FULL.map((dayName, idx) => {
                const cfg = availConfig[idx];
                return (
                  <div
                    key={idx}
                    className="rounded-[14px] p-3"
                    style={{
                      background: cfg.enabled ? "rgba(111,255,233,0.05)" : "var(--bg-card)",
                      border: `1px solid ${cfg.enabled ? "rgba(111,255,233,0.15)" : "var(--border-card)"}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Toggle */}
                      <button
                        onClick={() => {
                          const next = [...availConfig];
                          next[idx] = { ...next[idx], enabled: !next[idx].enabled };
                          setAvailConfig(next);
                        }}
                        className="flex h-5 w-9 flex-shrink-0 items-center rounded-full px-0.5 transition-all"
                        style={{ background: cfg.enabled ? "var(--accent-primary)" : "var(--input-border, rgba(255,255,255,0.1))" }}
                      >
                        <span
                          className="h-4 w-4 rounded-full bg-white transition-all"
                          style={{ transform: cfg.enabled ? "translateX(16px)" : "translateX(0)" }}
                        />
                      </button>
                      <span
                        className="w-24 flex-shrink-0 text-[12px] font-medium"
                        style={{ color: cfg.enabled ? "var(--text-primary)" : "var(--text-muted)" }}
                      >
                        {dayName}
                      </span>

                      {cfg.enabled && (
                        <div className="flex flex-1 flex-wrap items-center gap-2">
                          {/* Start time */}
                          <input
                            type="time"
                            value={cfg.start}
                            onChange={(e) => {
                              const next = [...availConfig];
                              next[idx] = { ...next[idx], start: e.target.value };
                              setAvailConfig(next);
                            }}
                            className="input-field text-[11px]"
                            style={{ padding: "6px 10px", width: "auto" }}
                          />
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>to</span>
                          {/* End time */}
                          <input
                            type="time"
                            value={cfg.end}
                            onChange={(e) => {
                              const next = [...availConfig];
                              next[idx] = { ...next[idx], end: e.target.value };
                              setAvailConfig(next);
                            }}
                            className="input-field text-[11px]"
                            style={{ padding: "6px 10px", width: "auto" }}
                          />
                          {/* Duration */}
                          <select
                            value={cfg.duration}
                            onChange={(e) => {
                              const next = [...availConfig];
                              next[idx] = { ...next[idx], duration: Number(e.target.value) };
                              setAvailConfig(next);
                            }}
                            className="input-field text-[11px]"
                            style={{ padding: "6px 10px", width: "auto" }}
                          >
                            {DURATIONS.map((d) => (
                              <option key={d} value={d}>{d} min</option>
                            ))}
                          </select>
                          {/* Preview slot count */}
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            → {generateSlotsForDay(idx, cfg).length} slots
                          </span>
                        </div>
                      )}

                      {!cfg.enabled && (
                        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Off</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {availError && (
              <div className="mt-4 rounded-[10px] p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
                {availError}
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowAvailModal(false)}
                className="flex-1 rounded-[14px] py-3 text-[13px] font-medium"
                style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-card)" }}
              >
                Cancel
              </button>
              <button
                onClick={saveAvailability}
                disabled={savingAvail}
                className="cta-button flex-1"
              >
                {savingAvail ? "Saving…" : "Save Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
