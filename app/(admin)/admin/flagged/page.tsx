"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import {
  Flag,
  Calendar,
  User,
  CheckCircle,
  Clock,
  CalendarPlus,
  BookOpen,
  Users,
  Heart,
  Brain,
  AlertTriangle,
} from "lucide-react";

interface FlaggedLog {
  id: number;
  studentId: number;
  student: { id: number; name: string; email: string };
  teacher: { id: number; name: string };
  date: string;
  category: string;
  severity: string;
  notes: string;
  flagForCounseling: boolean;
  counselingStatus: string;
  createdAt: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  ACADEMIC: { bg: "rgba(111,255,233,0.1)", color: "#6FFFE9", border: "rgba(111,255,233,0.15)" },
  SOCIAL: { bg: "rgba(167,139,250,0.1)", color: "#A78BFA", border: "rgba(167,139,250,0.15)" },
  EMOTIONAL: { bg: "rgba(255,107,107,0.1)", color: "#FF6B6B", border: "rgba(255,107,107,0.15)" },
  BEHAVIORAL: { bg: "rgba(255,217,61,0.1)", color: "#FFD93D", border: "rgba(255,217,61,0.15)" },
};

const SEVERITY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  LOW: { bg: "rgba(74,222,128,0.1)", color: "#4ADE80", border: "rgba(74,222,128,0.15)" },
  MODERATE: { bg: "rgba(255,217,61,0.1)", color: "#FFD93D", border: "rgba(255,217,61,0.15)" },
  HIGH: { bg: "rgba(251,146,60,0.1)", color: "#FB923C", border: "rgba(251,146,60,0.15)" },
  CRITICAL: { bg: "rgba(255,107,107,0.1)", color: "#FF6B6B", border: "rgba(255,107,107,0.15)" },
};

const STATUS_CONFIG: Record<string, { bg: string; color: string; border: string; label: string; icon: React.ReactNode }> = {
  NONE: { bg: "rgba(255,255,255,0.04)", color: "var(--text-muted)", border: "var(--border-card)", label: "Pending Review", icon: <Clock size={12} /> },
  PENDING: { bg: "rgba(255,217,61,0.1)", color: "#FFD93D", border: "rgba(255,217,61,0.15)", label: "Pending", icon: <Clock size={12} /> },
  SCHEDULED: { bg: "rgba(96,165,250,0.1)", color: "#60A5FA", border: "rgba(96,165,250,0.15)", label: "Scheduled", icon: <CalendarPlus size={12} /> },
  COMPLETED: { bg: "rgba(74,222,128,0.1)", color: "#4ADE80", border: "rgba(74,222,128,0.15)", label: "Completed", icon: <CheckCircle size={12} /> },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ACADEMIC: <BookOpen size={14} />,
  SOCIAL: <Users size={14} />,
  EMOTIONAL: <Heart size={14} />,
  BEHAVIORAL: <Brain size={14} />,
};

export default function AdminFlaggedPage() {
  const router = useRouter();
  const memberships = useAuthStore((s) => s.memberships);
  const orgId = memberships?.[0]?.organization?.id;

  const [flagged, setFlagged] = useState<FlaggedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    if (orgId) {
      fetchFlagged();
    }
  }, [orgId]);

  async function fetchFlagged() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/behavior-logs/flagged", { params: { orgId } });
      setFlagged(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch flagged students");
    } finally {
      setLoading(false);
    }
  }

  async function updateCounselingStatus(logId: number, status: string) {
    setUpdating(logId);
    try {
      await api.put(`/behavior-logs/${logId}/counseling-status`, { counselingStatus: status }, { params: { orgId } });
      // Update local state
      setFlagged((prev) =>
        prev.map((log) => (log.id === logId ? { ...log, counselingStatus: status } : log))
      );
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update status");
    } finally {
      setUpdating(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const filteredLogs = statusFilter === "ALL"
    ? flagged
    : flagged.filter((log) => log.counselingStatus === statusFilter);

  const statusCounts = {
    ALL: flagged.length,
    PENDING: flagged.filter((l) => l.counselingStatus === "PENDING" || l.counselingStatus === "NONE").length,
    SCHEDULED: flagged.filter((l) => l.counselingStatus === "SCHEDULED").length,
    COMPLETED: flagged.filter((l) => l.counselingStatus === "COMPLETED").length,
  };

  if (!orgId) {
    return (
      <div>
        <AdminTopbar title="Flagged Students" subtitle="Students referred for counseling" />
        <div className="p-8">
          <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            No organization membership found. You need to be part of an organization to view flagged students.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminTopbar title="Flagged Students" subtitle="Students referred for counseling by teachers" />

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
            Loading flagged students...
          </div>
        )}

        {!loading && (
          <>
            {/* Status Filter Pills */}
            <div className="mb-6 flex flex-wrap gap-2">
              {(["ALL", "PENDING", "SCHEDULED", "COMPLETED"] as const).map((status) => {
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
                    {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()} ({statusCounts[status]})
                  </button>
                );
              })}
            </div>

            {/* Flagged Cards */}
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const catStyle = CATEGORY_COLORS[log.category] || CATEGORY_COLORS.ACADEMIC;
                const sevStyle = SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.LOW;
                const statusConf = STATUS_CONFIG[log.counselingStatus] || STATUS_CONFIG.NONE;
                const isUpdating = updating === log.id;

                return (
                  <div key={log.id} className="glass-card p-5" style={{ borderRadius: "20px" }}>
                    {/* Top row: student info + status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div
                          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] text-[14px] font-bold"
                          style={{ background: "rgba(255,107,107,0.15)", color: "#FF6B6B" }}
                        >
                          {log.student.name.charAt(0)}
                        </div>

                        <div>
                          <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                            {log.student.name}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                              <User size={9} /> Flagged by {log.teacher.name}
                            </span>
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>·</span>
                            <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                              <Calendar size={9} /> {formatDate(log.date)}
                            </span>
                          </div>
                        </div>
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

                    {/* Category + Severity tags */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <div
                        className="flex items-center gap-1.5 rounded-pill px-2.5 py-1"
                        style={{ background: catStyle.bg, border: `1px solid ${catStyle.border}` }}
                      >
                        <span style={{ color: catStyle.color }}>{CATEGORY_ICONS[log.category]}</span>
                        <span className="text-[10px] font-medium" style={{ color: catStyle.color }}>
                          {log.category}
                        </span>
                      </div>
                      <span
                        className="tag"
                        style={{ background: sevStyle.bg, color: sevStyle.color, borderColor: sevStyle.border }}
                      >
                        {log.severity}
                      </span>
                    </div>

                    {/* Notes */}
                    <p className="mt-3 text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {log.notes}
                    </p>

                    {/* Action buttons */}
                    <div className="mt-4 flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: "var(--border-card)" }}>
                      {log.counselingStatus !== "COMPLETED" && (
                        <>
                          <button
                            onClick={() => router.push(`/admin/schedule?studentId=${log.studentId}`)}
                            className="flex items-center gap-1.5 rounded-[12px] px-3 py-2 text-[11px] font-medium"
                            style={{
                              background: "rgba(96,165,250,0.1)",
                              color: "#60A5FA",
                              border: "1px solid rgba(96,165,250,0.15)",
                            }}
                          >
                            <CalendarPlus size={13} />
                            Schedule Session
                          </button>

                          {log.counselingStatus !== "SCHEDULED" && (
                            <button
                              onClick={() => updateCounselingStatus(log.id, "SCHEDULED")}
                              disabled={isUpdating}
                              className="flex items-center gap-1.5 rounded-[12px] px-3 py-2 text-[11px] font-medium"
                              style={{
                                background: "rgba(255,217,61,0.1)",
                                color: "#FFD93D",
                                border: "1px solid rgba(255,217,61,0.15)",
                                opacity: isUpdating ? 0.5 : 1,
                              }}
                            >
                              <Clock size={13} />
                              {isUpdating ? "Updating..." : "Mark Scheduled"}
                            </button>
                          )}

                          <button
                            onClick={() => updateCounselingStatus(log.id, "COMPLETED")}
                            disabled={isUpdating}
                            className="flex items-center gap-1.5 rounded-[12px] px-3 py-2 text-[11px] font-medium"
                            style={{
                              background: "rgba(74,222,128,0.1)",
                              color: "#4ADE80",
                              border: "1px solid rgba(74,222,128,0.15)",
                              opacity: isUpdating ? 0.5 : 1,
                            }}
                          >
                            <CheckCircle size={13} />
                            {isUpdating ? "Updating..." : "Mark Completed"}
                          </button>
                        </>
                      )}

                      {log.counselingStatus === "COMPLETED" && (
                        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "#4ADE80" }}>
                          <CheckCircle size={13} />
                          Counseling completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            {filteredLogs.length === 0 && (
              <div className="py-12 text-center">
                <Flag size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                  {statusFilter === "ALL"
                    ? "No students have been flagged for counseling."
                    : `No flagged students with status "${statusFilter.toLowerCase()}".`}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
