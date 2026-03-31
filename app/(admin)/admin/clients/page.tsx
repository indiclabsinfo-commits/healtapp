"use client";

import { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { listCounsellorsApi } from "@/lib/counsellors";
import { getCounsellorConsultationsApi } from "@/lib/consultations";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Video,
  MapPin,
  FileText,
  Users,
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

const STATUS_CONFIG: Record<string, { bg: string; color: string; border: string; label: string; icon: React.ReactNode }> = {
  BOOKED: {
    bg: "rgba(96,165,250,0.1)", color: "#60A5FA", border: "rgba(96,165,250,0.15)",
    label: "Booked", icon: <Clock size={12} />,
  },
  COMPLETED: {
    bg: "rgba(74,222,128,0.1)", color: "#4ADE80", border: "rgba(74,222,128,0.15)",
    label: "Completed", icon: <CheckCircle size={12} />,
  },
  CANCELLED: {
    bg: "rgba(255,107,107,0.1)", color: "#FF6B6B", border: "rgba(255,107,107,0.15)",
    label: "Cancelled", icon: <XCircle size={12} />,
  },
  NO_SHOW: {
    bg: "rgba(255,217,61,0.1)", color: "#FFD93D", border: "rgba(255,217,61,0.15)",
    label: "No Show", icon: <AlertTriangle size={12} />,
  },
};

export default function AdminClientsPage() {
  const user = useAuthStore((s) => s.user);

  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [selectedCounsellorId, setSelectedCounsellorId] = useState<number | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [consultationsLoading, setConsultationsLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchCounsellors();
  }, []);

  useEffect(() => {
    if (selectedCounsellorId) {
      fetchConsultations(selectedCounsellorId);
    }
  }, [selectedCounsellorId]);

  async function fetchCounsellors() {
    setLoading(true);
    try {
      const res = await listCounsellorsApi({ limit: 100 });
      const list: Counsellor[] = res.data || [];
      setCounsellors(list);

      // Auto-select the first counsellor, or try to match by user name
      if (list.length > 0) {
        const matchByName = user?.name
          ? list.find((c) => c.name.toLowerCase().includes(user.name.toLowerCase()) || user.name.toLowerCase().includes(c.name.toLowerCase()))
          : null;
        setSelectedCounsellorId(matchByName?.id || list[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load counsellors");
    } finally {
      setLoading(false);
    }
  }

  async function fetchConsultations(counsellorId: number) {
    setConsultationsLoading(true);
    try {
      const res = await getCounsellorConsultationsApi(counsellorId, { limit: 100 });
      setConsultations(res.data || []);
    } catch (err: any) {
      setConsultations([]);
    } finally {
      setConsultationsLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(time: string) {
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  }

  function isUpcoming(dateStr: string, time: string): boolean {
    const d = new Date(dateStr);
    const [h, m] = time.split(":");
    d.setHours(parseInt(h), parseInt(m));
    return d > new Date();
  }

  const filteredConsultations = statusFilter === "ALL"
    ? consultations
    : consultations.filter((c) => c.status === statusFilter);

  // Sort: upcoming first, then by date desc
  const sortedConsultations = [...filteredConsultations].sort((a, b) => {
    const aUp = isUpcoming(a.date, a.time);
    const bUp = isUpcoming(b.date, b.time);
    if (aUp && !bUp) return -1;
    if (!aUp && bUp) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const statusCounts = {
    ALL: consultations.length,
    BOOKED: consultations.filter((c) => c.status === "BOOKED").length,
    COMPLETED: consultations.filter((c) => c.status === "COMPLETED").length,
    CANCELLED: consultations.filter((c) => c.status === "CANCELLED").length,
  };

  return (
    <div>
      <AdminTopbar title="My Clients" subtitle="View consultation history and client sessions" />

      <div className="p-8">
        {/* Error */}
        {error && (
          <div className="mb-4 rounded-card p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            Loading...
          </div>
        )}

        {!loading && (
          <>
            {/* Counsellor selector (if multiple) */}
            {counsellors.length > 1 && (
              <div className="mb-6">
                <p className="mb-2 text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  Counsellor
                </p>
                <div className="flex flex-wrap gap-2">
                  {counsellors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCounsellorId(c.id)}
                      className={`rounded-pill px-4 py-2 text-[11px] font-medium transition-all ${
                        selectedCounsellorId === c.id ? "pill-active" : "pill-inactive"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* KPIs */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="glass-card p-4" style={{ borderRadius: "16px" }}>
                <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Total Sessions</p>
                <p className="mt-1 font-heading text-[22px] font-bold" style={{ color: "var(--accent-primary)" }}>
                  {statusCounts.ALL}
                </p>
              </div>
              <div className="glass-card p-4" style={{ borderRadius: "16px" }}>
                <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Upcoming</p>
                <p className="mt-1 font-heading text-[22px] font-bold" style={{ color: "#60A5FA" }}>
                  {statusCounts.BOOKED}
                </p>
              </div>
              <div className="glass-card p-4" style={{ borderRadius: "16px" }}>
                <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Completed</p>
                <p className="mt-1 font-heading text-[22px] font-bold" style={{ color: "#4ADE80" }}>
                  {statusCounts.COMPLETED}
                </p>
              </div>
              <div className="glass-card p-4" style={{ borderRadius: "16px" }}>
                <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Cancelled</p>
                <p className="mt-1 font-heading text-[22px] font-bold" style={{ color: "#FF6B6B" }}>
                  {statusCounts.CANCELLED}
                </p>
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="mb-6 flex flex-wrap gap-2">
              {(["ALL", "BOOKED", "COMPLETED", "CANCELLED"] as const).map((status) => {
                const isActive = statusFilter === status;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className="rounded-pill px-4 py-2 text-[11px] font-medium transition-all"
                    style={
                      isActive
                        ? { background: "var(--gradient-cta)", color: "var(--cta-text)" }
                        : { background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border-card)" }
                    }
                  >
                    {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>

            {/* Loading consultations */}
            {consultationsLoading && (
              <div className="py-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                Loading consultations...
              </div>
            )}

            {/* Consultation Cards */}
            {!consultationsLoading && (
              <div className="space-y-3">
                {sortedConsultations.map((c) => {
                  const statusConf = STATUS_CONFIG[c.status] || STATUS_CONFIG.BOOKED;
                  const upcoming = isUpcoming(c.date, c.time);

                  return (
                    <div key={c.id} className="glass-card p-5" style={{ borderRadius: "20px" }}>
                      <div className="flex items-start gap-4">
                        {/* Date block */}
                        <div
                          className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-[14px]"
                          style={{
                            background: upcoming ? "var(--gradient-cta)" : "var(--input-bg)",
                            color: upcoming ? "var(--cta-text)" : "var(--text-secondary)",
                          }}
                        >
                          <span className="text-[16px] font-bold leading-none">
                            {new Date(c.date).getDate()}
                          </span>
                          <span className="text-[9px] uppercase tracking-[0.5px]">
                            {new Date(c.date).toLocaleDateString("en-IN", { month: "short" })}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                                {c.user.name}
                              </p>
                              <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                                {c.user.email}
                              </p>
                            </div>

                            {/* Status tag */}
                            <div
                              className="flex items-center gap-1.5 rounded-pill px-3 py-1.5"
                              style={{ background: statusConf.bg, border: `1px solid ${statusConf.border}`, color: statusConf.color }}
                            >
                              {statusConf.icon}
                              <span className="text-[10px] font-medium uppercase tracking-[0.5px]">
                                {statusConf.label}
                              </span>
                            </div>
                          </div>

                          {/* Time + type */}
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                              <Clock size={12} /> {formatTime(c.time)} · {c.duration} min
                            </span>
                            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                              {c.type === "VIDEO" ? <Video size={12} /> : <MapPin size={12} />}
                              {c.type === "VIDEO" ? "Video Call" : "In Person"}
                            </span>
                            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                              <Calendar size={12} /> {formatDate(c.date)}
                            </span>
                          </div>

                          {/* Notes preview (for completed sessions) */}
                          {c.status === "COMPLETED" && c.notes && (
                            <div
                              className="mt-3 rounded-[12px] p-3"
                              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
                            >
                              <div className="mb-1 flex items-center gap-1.5">
                                <FileText size={11} style={{ color: "var(--accent-primary)" }} />
                                <span className="text-[10px] font-medium uppercase tracking-[1px]" style={{ color: "var(--accent-primary)" }}>
                                  Session Notes
                                </span>
                              </div>
                              <p className="line-clamp-3 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                                {c.notes}
                              </p>
                            </div>
                          )}

                          {c.status === "COMPLETED" && c.summary && (
                            <div
                              className="mt-2 rounded-[12px] p-3"
                              style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.1)" }}
                            >
                              <div className="mb-1 flex items-center gap-1.5">
                                <CheckCircle size={11} style={{ color: "#4ADE80" }} />
                                <span className="text-[10px] font-medium uppercase tracking-[1px]" style={{ color: "#4ADE80" }}>
                                  Summary
                                </span>
                              </div>
                              <p className="line-clamp-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                                {c.summary}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {!consultationsLoading && sortedConsultations.length === 0 && (
              <div className="py-12 text-center">
                <Users size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                  {statusFilter === "ALL"
                    ? "No consultations found for this counsellor."
                    : `No consultations with status "${statusFilter.toLowerCase()}".`}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
