"use client";

import { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import {
  getCounsellorConsultationsApi,
  updateConsultationStatusApi,
  updateConsultationNotesApi,
} from "@/lib/consultations";
import { listCounsellorsApi } from "@/lib/counsellors";
import {
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  X,
  Loader2,
  User,
  Video,
  MapPin,
  AlertCircle,
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

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  BOOKED: {
    bg: "rgba(111,255,233,0.1)",
    color: "#6FFFE9",
    border: "rgba(111,255,233,0.15)",
    label: "Booked",
  },
  COMPLETED: {
    bg: "rgba(74,222,128,0.1)",
    color: "#4ADE80",
    border: "rgba(74,222,128,0.15)",
    label: "Completed",
  },
  CANCELLED: {
    bg: "rgba(255,107,107,0.1)",
    color: "#FF6B6B",
    border: "rgba(255,107,107,0.15)",
    label: "Cancelled",
  },
  NO_SHOW: {
    bg: "rgba(255,217,61,0.1)",
    color: "#FFD93D",
    border: "rgba(255,217,61,0.15)",
    label: "No Show",
  },
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function isSameDay(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

function isWithinNextDays(dateStr: string, days: number): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days + 1);
  return d >= start && d < end;
}

export default function AdminSchedulePage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [selectedCounsellorId, setSelectedCounsellorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Notes modal
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesConsultation, setNotesConsultation] = useState<Consultation | null>(null);
  const [notesText, setNotesText] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Action loading
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchCounsellors();
  }, []);

  useEffect(() => {
    if (selectedCounsellorId) {
      fetchConsultations(selectedCounsellorId);
    }
  }, [selectedCounsellorId]);

  async function fetchCounsellors() {
    try {
      const res = await listCounsellorsApi({ limit: 100 });
      const list = res.data || [];
      setCounsellors(list);
      if (list.length > 0) {
        setSelectedCounsellorId(list[0].id);
      }
    } catch {
      setError("Failed to load counsellors");
      setLoading(false);
    }
  }

  async function fetchConsultations(counsellorId: number) {
    try {
      setLoading(true);
      setError("");
      const res = await getCounsellorConsultationsApi(counsellorId, { limit: 100 });
      setConsultations(res.data || []);
    } catch {
      setError("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(id: number) {
    try {
      setActionLoadingId(id);
      await updateConsultationStatusApi(id, "COMPLETED");
      setConsultations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "COMPLETED" } : c))
      );
    } catch {
      // silent
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleNoShow(id: number) {
    try {
      setActionLoadingId(id);
      await updateConsultationStatusApi(id, "NO_SHOW");
      setConsultations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "NO_SHOW" } : c))
      );
    } catch {
      // silent
    } finally {
      setActionLoadingId(null);
    }
  }

  function openNotesModal(c: Consultation) {
    setNotesConsultation(c);
    setNotesText(c.notes || "");
    setSummaryText(c.summary || "");
    setShowNotesModal(true);
  }

  async function handleSaveNotes() {
    if (!notesConsultation) return;
    try {
      setSavingNotes(true);
      await updateConsultationNotesApi(notesConsultation.id, {
        notes: notesText,
        summary: summaryText,
      });
      setConsultations((prev) =>
        prev.map((c) =>
          c.id === notesConsultation.id
            ? { ...c, notes: notesText, summary: summaryText }
            : c
        )
      );
      setShowNotesModal(false);
    } catch {
      // silent
    } finally {
      setSavingNotes(false);
    }
  }

  const today = new Date();
  const todaySessions = consultations.filter(
    (c) => isSameDay(c.date, today) && c.status === "BOOKED"
  );
  const upcomingSessions = consultations.filter(
    (c) => isWithinNextDays(c.date, 7) && c.status === "BOOKED"
  );
  const recentSessions = consultations.filter(
    (c) => c.status === "COMPLETED" || c.status === "NO_SHOW"
  ).slice(0, 10);

  function renderSessionCard(c: Consultation) {
    const statusStyle = STATUS_STYLES[c.status] || STATUS_STYLES.BOOKED;
    const isActionLoading = actionLoadingId === c.id;

    return (
      <div key={c.id} className="glass-card p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-icon text-[13px] font-bold"
              style={{
                background: "var(--tag-bg)",
                color: "var(--accent-primary)",
              }}
            >
              {getInitials(c.user.name)}
            </div>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                {c.user.name}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {c.user.email}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className="rounded-full px-2 py-[2px] text-[9px] font-medium"
              style={{
                background: statusStyle.bg,
                color: statusStyle.color,
                border: `1px solid ${statusStyle.border}`,
              }}
            >
              {statusStyle.label}
            </span>
            <span
              className="rounded-full px-2 py-[2px] text-[9px] font-medium"
              style={{
                background: "var(--input-bg)",
                color: "var(--text-muted)",
                border: "1px solid var(--input-border)",
              }}
            >
              {c.type === "VIDEO" ? "Video" : "In Person"}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Calendar size={12} style={{ color: "var(--text-muted)" }} />
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              {new Date(c.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} style={{ color: "var(--text-muted)" }} />
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              {c.time} &middot; {c.duration} min
            </span>
          </div>
          <div className="flex items-center gap-1">
            {c.type === "VIDEO" ? (
              <Video size={12} style={{ color: "var(--text-muted)" }} />
            ) : (
              <MapPin size={12} style={{ color: "var(--text-muted)" }} />
            )}
          </div>
        </div>

        {/* Actions for booked sessions */}
        {c.status === "BOOKED" && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleComplete(c.id)}
              disabled={isActionLoading}
              className="flex flex-1 items-center justify-center gap-1 rounded-[12px] py-2 text-[11px] font-medium transition-all"
              style={{
                background: "rgba(74,222,128,0.1)",
                color: "#4ADE80",
                border: "1px solid rgba(74,222,128,0.2)",
              }}
            >
              {isActionLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CheckCircle2 size={12} />
              )}
              Complete
            </button>
            <button
              onClick={() => handleNoShow(c.id)}
              disabled={isActionLoading}
              className="flex flex-1 items-center justify-center gap-1 rounded-[12px] py-2 text-[11px] font-medium transition-all"
              style={{
                background: "rgba(255,217,61,0.1)",
                color: "#FFD93D",
                border: "1px solid rgba(255,217,61,0.2)",
              }}
            >
              <AlertCircle size={12} />
              No Show
            </button>
            <button
              onClick={() => openNotesModal(c)}
              className="flex flex-1 items-center justify-center gap-1 rounded-[12px] py-2 text-[11px] font-medium transition-all"
              style={{
                background: "var(--tag-bg)",
                color: "var(--accent-primary)",
                border: "1px solid var(--tag-border)",
              }}
            >
              <FileText size={12} />
              Notes
            </button>
          </div>
        )}

        {/* Notes button for completed sessions */}
        {(c.status === "COMPLETED" || c.status === "NO_SHOW") && (
          <button
            onClick={() => openNotesModal(c)}
            className="mt-3 flex items-center gap-1 text-[11px] font-medium"
            style={{ color: "var(--accent-primary)" }}
          >
            <FileText size={12} />
            {c.notes || c.summary ? "Edit Notes" : "Add Notes"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <AdminTopbar title="My Schedule" subtitle="Manage counselling sessions" />

      <div className="p-4 lg:p-8">
        {/* Counsellor selector */}
        <div className="mb-6">
          <label
            className="mb-2 block text-[11px] font-medium uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Select Counsellor
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {counsellors.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCounsellorId(c.id)}
                className={
                  selectedCounsellorId === c.id ? "pill-active" : "pill-inactive"
                }
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-12 flex justify-center">
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="glass-card mt-6 p-4 text-center">
            <p className="text-[13px]" style={{ color: "#FF6B6B" }}>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Today's Sessions */}
            <div className="mb-6">
              <h2
                className="font-heading text-[18px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Today{" "}
                <span className="text-[13px] font-normal" style={{ color: "var(--text-muted)" }}>
                  ({todaySessions.length} session{todaySessions.length !== 1 ? "s" : ""})
                </span>
              </h2>
              {todaySessions.length === 0 ? (
                <div className="glass-card mt-3 p-6 text-center">
                  <Calendar size={28} style={{ color: "var(--text-muted)", margin: "0 auto" }} />
                  <p className="mt-2 text-[13px]" style={{ color: "var(--text-muted)" }}>
                    No sessions scheduled for today
                  </p>
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  {todaySessions.map(renderSessionCard)}
                </div>
              )}
            </div>

            {/* Upcoming Sessions */}
            <div className="mb-6">
              <h2
                className="font-heading text-[18px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Upcoming{" "}
                <span className="text-[13px] font-normal" style={{ color: "var(--text-muted)" }}>
                  (next 7 days)
                </span>
              </h2>
              {upcomingSessions.length === 0 ? (
                <div className="glass-card mt-3 p-6 text-center">
                  <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                    No upcoming sessions
                  </p>
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  {upcomingSessions.map(renderSessionCard)}
                </div>
              )}
            </div>

            {/* Recent Sessions */}
            {recentSessions.length > 0 && (
              <div className="mb-6">
                <h2
                  className="font-heading text-[18px] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Recent
                </h2>
                <div className="mt-3 flex flex-col gap-3">
                  {recentSessions.map(renderSessionCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Notes Modal */}
      {showNotesModal && notesConsultation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-lg rounded-[20px] p-6"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-card)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="font-heading text-[18px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Session Notes
              </h3>
              <button onClick={() => setShowNotesModal(false)} className="p-1">
                <X size={18} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <User size={12} style={{ color: "var(--text-muted)" }} />
              <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                {notesConsultation.user.name} &middot;{" "}
                {new Date(notesConsultation.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                at {notesConsultation.time}
              </span>
            </div>

            <div className="mt-5">
              <label
                className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Summary (visible to user)
              </label>
              <textarea
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                rows={3}
                className="input-field w-full resize-none"
                placeholder="Brief summary of the session..."
              />
            </div>

            <div className="mt-4">
              <label
                className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Private Notes (counsellor only)
              </label>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                rows={4}
                className="input-field w-full resize-none"
                placeholder="Detailed notes, observations, plan..."
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowNotesModal(false)}
                className="flex-1 rounded-[14px] py-3 text-[13px] font-medium"
                style={{
                  border: "1px solid var(--border-card)",
                  color: "var(--text-secondary)",
                  background: "transparent",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="cta-button flex flex-1 items-center justify-center gap-2"
              >
                {savingNotes ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileText size={14} />
                )}
                {savingNotes ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
