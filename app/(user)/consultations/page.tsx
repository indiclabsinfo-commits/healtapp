"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Video,
  MapPin,
  Loader2,
  CalendarX2,
} from "lucide-react";
import { getMyConsultationsApi, updateConsultationStatusApi } from "@/lib/consultations";

interface Counsellor {
  id: number;
  name: string;
  specialization: string;
  photo: string | null;
}

interface Consultation {
  id: number;
  counsellorId: number;
  counsellor: Counsellor;
  date: string;
  time: string;
  duration: number;
  status: "BOOKED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  type: string;
  notes: string | null;
  summary: string | null;
  createdAt: string;
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

function isUpcoming(dateStr: string, time: string): boolean {
  const consultDate = new Date(dateStr);
  const [hours, minutes] = time.split(":").map(Number);
  consultDate.setHours(hours, minutes, 0, 0);
  return consultDate > new Date();
}

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    fetchConsultations();
  }, []);

  async function fetchConsultations() {
    try {
      setLoading(true);
      setError("");
      const res = await getMyConsultationsApi({ limit: 50 });
      setConsultations(res.data || []);
    } catch {
      setError("Failed to load consultations");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id: number) {
    try {
      setCancellingId(id);
      await updateConsultationStatusApi(id, "CANCELLED");
      setConsultations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "CANCELLED" } : c))
      );
    } catch {
      // silent
    } finally {
      setCancellingId(null);
    }
  }

  const upcoming = consultations.filter(
    (c) => c.status === "BOOKED" && isUpcoming(c.date, c.time)
  );
  const past = consultations.filter(
    (c) => c.status !== "BOOKED" || !isUpcoming(c.date, c.time)
  );

  function renderCard(c: Consultation, showCancel: boolean) {
    const statusStyle = STATUS_STYLES[c.status] || STATUS_STYLES.BOOKED;
    const isExpanded = expandedId === c.id;

    return (
      <div key={c.id} className="glass-card p-4 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-icon text-[14px] font-bold"
              style={{
                background: "var(--tag-bg)",
                color: "var(--accent-primary)",
              }}
            >
              {getInitials(c.counsellor.name)}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                {c.counsellor.name}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {c.counsellor.specialization}
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
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} style={{ color: "var(--text-muted)" }} />
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              {c.time} &middot; {c.duration} min
            </span>
          </div>
        </div>

        {/* Expand/collapse for notes */}
        {(c.summary || c.notes) && (
          <button
            onClick={() => setExpandedId(isExpanded ? null : c.id)}
            className="mt-3 flex items-center gap-1 text-[11px] font-medium"
            style={{ color: "var(--accent-primary)" }}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {isExpanded ? "Hide Details" : "View Details"}
          </button>
        )}

        {isExpanded && (
          <div className="mt-3 space-y-2">
            {c.summary && (
              <div
                className="rounded-[12px] p-3"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
              >
                <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Summary
                </p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  {c.summary}
                </p>
              </div>
            )}
            {c.notes && (
              <div
                className="rounded-[12px] p-3"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
              >
                <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Counsellor Notes
                </p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  {c.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Cancel button */}
        {showCancel && c.status === "BOOKED" && (
          <button
            onClick={() => handleCancel(c.id)}
            disabled={cancellingId === c.id}
            className="mt-3 w-full rounded-[14px] py-2 text-[12px] font-medium transition-all"
            style={{
              border: "1px solid rgba(255,107,107,0.3)",
              color: "#FF6B6B",
              background: "transparent",
            }}
          >
            {cancellingId === c.id ? "Cancelling..." : "Cancel Session"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1
        className="font-heading text-[22px] font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        My Sessions<span style={{ color: "var(--accent-primary)" }}>.</span>
      </h1>
      <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
        Track your counselling journey
      </p>

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
          <button
            onClick={fetchConsultations}
            className="mt-3 text-[12px] font-medium"
            style={{ color: "var(--accent-primary)" }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && consultations.length === 0 && (
        <div className="mt-12 flex flex-col items-center">
          <CalendarX2 size={48} style={{ color: "var(--text-muted)" }} />
          <p className="mt-4 text-[13px]" style={{ color: "var(--text-muted)" }}>
            No sessions yet
          </p>
          <a
            href="/book"
            className="mt-3 text-[12px] font-medium"
            style={{ color: "var(--accent-primary)" }}
          >
            Book your first session
          </a>
        </div>
      )}

      {!loading && !error && consultations.length > 0 && (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="mt-5">
              <h2
                className="font-heading text-[15px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Upcoming
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {upcoming.map((c) => renderCard(c, true))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div className="mt-6">
              <h2
                className="font-heading text-[15px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Past
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {past.map((c) => renderCard(c, false))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
