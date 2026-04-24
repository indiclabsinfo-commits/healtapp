"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import {
  Users,
  User,
  Smile,
  Meh,
  Frown,
  ClipboardList,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Calendar,
  BookOpen,
  Heart,
  Brain,
  Flag,
} from "lucide-react";

interface StudentMember {
  id: number;
  role: string;
  class?: string | null;
  creditBalance: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface MoodEntry {
  id: number;
  mood: number;
  date: string;
}

interface BehaviorLogEntry {
  id: number;
  date: string;
  category: string;
  severity: string;
  notes: string;
  flagForCounseling: boolean;
  counselingStatus: string;
}

interface StudentData {
  member: StudentMember;
  lastMood: number | null;
  assessmentCount: number;
  behaviorLogCount: number;
  recentLogs: BehaviorLogEntry[];
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

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ACADEMIC: <BookOpen size={12} />,
  SOCIAL: <Users size={12} />,
  EMOTIONAL: <Heart size={12} />,
  BEHAVIORAL: <Brain size={12} />,
};

function MoodIcon({ mood }: { mood: number | null }) {
  if (mood === null) return <Meh size={16} style={{ color: "var(--text-muted)" }} />;
  if (mood >= 4) return <Smile size={16} style={{ color: "#4ADE80" }} />;
  if (mood >= 3) return <Meh size={16} style={{ color: "#FFD93D" }} />;
  return <Frown size={16} style={{ color: "#FF6B6B" }} />;
}

function moodLabel(mood: number | null): string {
  if (mood === null) return "No data";
  const labels: Record<number, string> = { 1: "Very Low", 2: "Low", 3: "Okay", 4: "Good", 5: "Great" };
  return labels[mood] || `${mood}/5`;
}

export default function AdminStudentsPage() {
  const router = useRouter();
  const memberships = useAuthStore((s) => s.memberships);
  const teacherClass = memberships?.[0]?.class;
  const orgId = memberships?.[0]?.organization?.id;

  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);

  useEffect(() => {
    if (orgId) {
      fetchStudents();
    }
  }, [orgId]);

  async function fetchStudents() {
    setLoading(true);
    setError("");
    try {
      // Get org members filtered by student role
      const params: Record<string, any> = { role: "STUDENT", limit: 200 };
      const membersRes = await api.get(`/organizations/${orgId}/members`, { params });
      const membersList: StudentMember[] = membersRes.data.data || [];

      // Filter by teacher's class if available
      const filtered = teacherClass
        ? membersList.filter((m) => m.class === teacherClass)
        : membersList;

      // For each student, fetch additional data in parallel
      const studentDataPromises = filtered.map(async (member) => {
        let lastMood: number | null = null;
        let assessmentCount = 0;
        let behaviorLogCount = 0;
        let recentLogs: BehaviorLogEntry[] = [];

        try {
          // Fetch mood logs for this student (we can only get moods for ourselves via /mood/history,
          // so we'll fetch behavior logs which teachers can access)
          const logsRes = await api.get("/behavior-logs", {
            params: { orgId, studentId: member.user.id, limit: 5 },
          });
          const logs = logsRes.data.data || [];
          behaviorLogCount = logsRes.data.pagination?.total || logs.length;
          recentLogs = logs;
        } catch {
          // Behavior logs endpoint may not return data
        }

        return {
          member,
          lastMood,
          assessmentCount,
          behaviorLogCount,
          recentLogs,
        };
      });

      const studentData = await Promise.all(studentDataPromises);
      setStudents(studentData);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function toggleExpand(studentUserId: number) {
    setExpandedStudent(expandedStudent === studentUserId ? null : studentUserId);
  }

  if (!orgId) {
    return (
      <div>
        <AdminTopbar title="My Students" subtitle="View and manage your class students" />
        <div className="p-8">
          <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            No organization membership found. You need to be part of an organization to view students.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminTopbar
        title="My Students"
        subtitle={teacherClass ? `Class ${teacherClass} — ${students.length} student${students.length !== 1 ? "s" : ""}` : "All students in your organization"}
      />

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
            Loading students...
          </div>
        )}

        {/* Summary KPIs */}
        {!loading && students.length > 0 && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="glass-card p-5" style={{ borderRadius: "20px" }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                  style={{ background: "rgba(111,255,233,0.1)", color: "#6FFFE9" }}
                >
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Total Students</p>
                  <p className="font-heading text-[24px] font-bold" style={{ color: "var(--accent-primary)" }}>{students.length}</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-5" style={{ borderRadius: "20px" }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                  style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}
                >
                  <Flag size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Flagged for Counseling</p>
                  <p className="font-heading text-[24px] font-bold" style={{ color: "#FF6B6B" }}>
                    {students.filter((s) => s.recentLogs.some((l) => l.flagForCounseling)).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-5" style={{ borderRadius: "20px" }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                  style={{ background: "rgba(167,139,250,0.1)", color: "#A78BFA" }}
                >
                  <ClipboardList size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Total Behavior Logs</p>
                  <p className="font-heading text-[24px] font-bold" style={{ color: "#A78BFA" }}>
                    {students.reduce((sum, s) => sum + s.behaviorLogCount, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Cards */}
        {!loading && (
          <div className="space-y-3">
            {students.map((s) => {
              const isExpanded = expandedStudent === s.member.user.id;
              const hasFlagged = s.recentLogs.some((l) => l.flagForCounseling);

              return (
                <div key={s.member.id} className="glass-card overflow-hidden" style={{ borderRadius: "20px" }}>
                  {/* Main card content */}
                  <div className="flex items-center gap-4 p-5">
                    {/* Avatar */}
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px] text-[16px] font-bold"
                      style={{ background: "var(--gradient-cta)", color: "var(--cta-text)" }}
                    >
                      {s.member.user.name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                          {s.member.user.name}
                        </p>
                        {hasFlagged && (
                          <div
                            className="flex items-center gap-1 rounded-pill px-2 py-0.5"
                            style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.15)" }}
                          >
                            <Flag size={9} style={{ color: "#FF6B6B" }} />
                            <span className="text-[8px] font-medium uppercase tracking-[0.5px]" style={{ color: "#FF6B6B" }}>
                              Flagged
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {s.member.user.email}
                        {s.member.class ? ` · Class ${s.member.class}` : ""}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="hidden items-center gap-4 sm:flex">
                      <div className="text-center">
                        <p className="text-[14px] font-bold" style={{ color: "var(--accent-primary)" }}>
                          {s.behaviorLogCount}
                        </p>
                        <p className="text-[9px] uppercase tracking-[1px]" style={{ color: "var(--text-muted)" }}>Logs</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/admin/clients/${s.member.user.id}`)}
                        className="rounded-[12px] px-3 py-2 text-[11px] font-medium"
                        style={{
                          background: "rgba(167,139,250,0.1)",
                          color: "#A78BFA",
                          border: "1px solid rgba(167,139,250,0.15)",
                        }}
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => router.push(`/admin/behavior-log?studentId=${s.member.user.id}`)}
                        className="rounded-[12px] px-3 py-2 text-[11px] font-medium"
                        style={{
                          background: "rgba(111,255,233,0.1)",
                          color: "#6FFFE9",
                          border: "1px solid rgba(111,255,233,0.15)",
                        }}
                      >
                        Log
                      </button>
                      <button
                        onClick={() => toggleExpand(s.member.user.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-[10px]"
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-card)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded: Recent behavior logs */}
                  {isExpanded && (
                    <div
                      className="border-t px-5 pb-5 pt-4"
                      style={{ borderColor: "var(--border-card)" }}
                    >
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                        Recent Behavior Logs
                      </p>
                      {s.recentLogs.length === 0 ? (
                        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                          No behavior logs recorded for this student.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {s.recentLogs.map((log) => {
                            const catStyle = CATEGORY_COLORS[log.category] || CATEGORY_COLORS.ACADEMIC;
                            const sevStyle = SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.LOW;
                            return (
                              <div
                                key={log.id}
                                className="flex items-start gap-3 rounded-[14px] p-3"
                                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
                              >
                                <div
                                  className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[8px]"
                                  style={{ background: catStyle.bg, color: catStyle.color }}
                                >
                                  {CATEGORY_ICONS[log.category] || <BookOpen size={12} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="tag"
                                      style={{ background: catStyle.bg, color: catStyle.color, borderColor: catStyle.border }}
                                    >
                                      {log.category}
                                    </span>
                                    <span
                                      className="tag"
                                      style={{ background: sevStyle.bg, color: sevStyle.color, borderColor: sevStyle.border }}
                                    >
                                      {log.severity}
                                    </span>
                                    {log.flagForCounseling && (
                                      <span
                                        className="tag"
                                        style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B", borderColor: "rgba(255,107,107,0.15)" }}
                                      >
                                        Flagged
                                      </span>
                                    )}
                                    <span className="ml-auto flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                                      <Calendar size={9} /> {formatDate(log.date)}
                                    </span>
                                  </div>
                                  <p className="mt-1.5 line-clamp-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                                    {log.notes}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && students.length === 0 && (
          <div className="py-12 text-center">
            <Users size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              {teacherClass
                ? `No students found in class ${teacherClass}.`
                : "No students found in your organization."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
