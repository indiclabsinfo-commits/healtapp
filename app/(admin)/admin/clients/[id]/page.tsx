"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { getCounsellorConsultationsApi } from "@/lib/consultations";
import { listCounsellorsApi } from "@/lib/counsellors";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  BookOpen,
  Users,
  Heart,
  Zap,
  FileText,
  Lightbulb,
  Tag,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface BehaviorLog {
  id: number;
  date: string;
  category: string;
  severity: string;
  notes: string;
  flagForCounseling: boolean;
  counselingStatus: string;
  teacher?: { id: number; name: string };
}

interface Consultation {
  id: number;
  userId: number;
  user: { id: number; name: string; email: string };
  date: string;
  time: string;
  status: string;
  notes: string | null;
  summary: string | null;
}

const CATEGORY_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  ACADEMIC: { color: "#60A5FA", bg: "rgba(96,165,250,0.12)", label: "Academic" },
  SOCIAL: { color: "#A78BFA", bg: "rgba(167,139,250,0.12)", label: "Social" },
  EMOTIONAL: { color: "#F472B6", bg: "rgba(244,114,182,0.12)", label: "Emotional" },
  BEHAVIORAL: { color: "#FBBF24", bg: "rgba(251,191,36,0.12)", label: "Behavioural" },
};

const SEVERITY_STYLES: Record<string, { color: string; bg: string }> = {
  LOW: { color: "#4ADE80", bg: "rgba(74,222,128,0.12)" },
  MODERATE: { color: "#FFD93D", bg: "rgba(255,217,61,0.12)" },
  HIGH: { color: "#FB923C", bg: "rgba(251,146,60,0.12)" },
  CRITICAL: { color: "#FF6B6B", bg: "rgba(255,107,107,0.12)" },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ACADEMIC: <BookOpen size={12} />,
  SOCIAL: <Users size={12} />,
  EMOTIONAL: <Heart size={12} />,
  BEHAVIORAL: <Zap size={12} />,
};

function severityScore(s: string) {
  return { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4 }[s] ?? 1;
}

function computeRisk(logs: BehaviorLog[]): "HIGH" | "MEDIUM" | "LOW" {
  const recent14 = logs.filter((l) => {
    const days = (Date.now() - new Date(l.date).getTime()) / 86400000;
    return days <= 14;
  });
  if (recent14.some((l) => l.severity === "CRITICAL" || l.severity === "HIGH")) return "HIGH";
  if (recent14.some((l) => l.severity === "MODERATE")) return "MEDIUM";
  return "LOW";
}

function computeTrend(logs: BehaviorLog[]): "Increasing" | "Stable" | "Decreasing" {
  if (logs.length < 3) return "Stable";
  const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const first = sorted.slice(0, Math.ceil(sorted.length / 2));
  const last = sorted.slice(Math.floor(sorted.length / 2));
  const avgFirst = first.reduce((s, l) => s + severityScore(l.severity), 0) / first.length;
  const avgLast = last.reduce((s, l) => s + severityScore(l.severity), 0) / last.length;
  if (avgLast > avgFirst + 0.3) return "Increasing";
  if (avgLast < avgFirst - 0.3) return "Decreasing";
  return "Stable";
}

function recentFlagCount(logs: BehaviorLog[]): number {
  return logs.filter((l) => {
    const days = (Date.now() - new Date(l.date).getTime()) / 86400000;
    return days <= 14;
  }).length;
}

function getTopBehaviors(logs: BehaviorLog[]): string[] {
  const freq: Record<string, number> = {};
  logs.forEach((l) => {
    const cat = CATEGORY_STYLES[l.category]?.label || l.category;
    freq[cat] = (freq[cat] || 0) + 1;
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);
}

function getTriggerTags(logs: BehaviorLog[]): string[] {
  const tags = new Set<string>();
  logs.forEach((l) => {
    if (l.category === "SOCIAL") tags.add("Conflict with peers");
    if (l.category === "ACADEMIC") tags.add("Academic pressure");
    if (l.category === "BEHAVIORAL") tags.add("Emotional dysregulation");
    if (l.category === "EMOTIONAL") tags.add("Emotional distress");
  });
  return Array.from(tags).slice(0, 4);
}

function generateInsight(logs: BehaviorLog[], risk: string, trend: string): string {
  const count = logs.length;
  const categories = [...new Set(logs.map((l) => CATEGORY_STYLES[l.category]?.label || l.category))];
  if (count === 0) return "No behavioral data available for this student.";
  if (risk === "HIGH" && trend === "Increasing") {
    return `Escalation Pattern: Repeated ${categories.join(" and ")} incidents over ${Math.ceil((Date.now() - new Date(logs[logs.length - 1]?.date || Date.now()).getTime()) / 86400000)} days, worsening.`;
  }
  if (risk === "HIGH") return `Consistent ${categories[0]} concerns with high severity incidents logged.`;
  if (trend === "Decreasing") return `Improvement observed — severity of incidents has reduced over recent weeks.`;
  return `Pattern of ${categories.join(" and ")} observations noted. Monitor for escalation.`;
}

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const memberships = useAuthStore((s) => s.memberships);
  const orgId = memberships?.[0]?.organization?.id;
  const authUser = useAuthStore((s) => s.user);

  const [behaviorLogs, setBehaviorLogs] = useState<BehaviorLog[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [studentName, setStudentName] = useState<string>("");
  const [studentClass, setStudentClass] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && orgId) load();
  }, [id, orgId]);

  async function load() {
    setLoading(true);
    try {
      const [logsRes, membersRes] = await Promise.all([
        api.get("/behavior-logs", { params: { orgId, studentId: parseInt(id), limit: 100 } }),
        api.get(`/organizations/${orgId}/members`, { params: { role: "STUDENT", limit: 200 } }),
      ]);

      const logs: BehaviorLog[] = logsRes.data.data || [];
      setBehaviorLogs(logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

      const members = membersRes.data.data || [];
      const member = members.find((m: any) => m.user.id === parseInt(id));
      if (member) {
        setStudentName(member.user.name);
        setStudentClass(member.class || "");
      }

      // Get counsellor's consultations and filter by this student
      try {
        const counsellorsRes = await listCounsellorsApi({ limit: 100 });
        const counsellors = counsellorsRes.data || [];
        if (counsellors.length > 0) {
          // Try matching counsellor by logged-in user name
          const matched = counsellors.find(
            (c: any) => authUser?.name && c.name.toLowerCase().includes(authUser.name.toLowerCase())
          ) || counsellors[0];
          const conRes = await getCounsellorConsultationsApi(matched.id, { limit: 100 });
          const all: Consultation[] = conRes.data || [];
          setConsultations(all.filter((c) => c.userId === parseInt(id)));
        }
      } catch {
        // Ignore
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  const risk = computeRisk(behaviorLogs);
  const trend = computeTrend(behaviorLogs);
  const flagCount = recentFlagCount(behaviorLogs);
  const topBehaviors = getTopBehaviors(behaviorLogs);
  const triggerTags = getTriggerTags(behaviorLogs);
  const systemInsight = generateInsight(behaviorLogs, risk, trend);

  const RISK_STYLES = {
    HIGH: { color: "#FF6B6B", bg: "rgba(255,107,107,0.15)" },
    MEDIUM: { color: "#FBBF24", bg: "rgba(251,191,36,0.15)" },
    LOW: { color: "#4ADE80", bg: "rgba(74,222,128,0.15)" },
  };

  const riskStyle = RISK_STYLES[risk];
  const TrendIcon = trend === "Increasing" ? TrendingUp : trend === "Decreasing" ? TrendingDown : Minus;
  const trendColor = trend === "Increasing" ? "#FF6B6B" : trend === "Decreasing" ? "#4ADE80" : "#FFD93D";

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  function daysSinceFirst(logs: BehaviorLog[]): number {
    if (logs.length === 0) return 0;
    return Math.ceil((Date.now() - new Date(logs[0].date).getTime()) / 86400000);
  }

  return (
    <div>
      <AdminTopbar
        title={studentName || "Student Profile"}
        subtitle="Counsellor view — behavioral history & insights"
      />

      <div className="p-4 lg:p-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-5 flex items-center gap-2 text-[13px] transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={14} /> Back to Clients
        </button>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* LEFT COLUMN — Timeline & Observations */}
            <div className="xl:col-span-2 space-y-6">
              {/* Student Header Card */}
              <div className="glass-card p-5" style={{ borderRadius: "20px" }}>
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[16px] text-[22px] font-bold"
                    style={{ background: "var(--gradient-cta)", color: "var(--cta-text)" }}
                  >
                    {studentName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-[20px] font-bold" style={{ color: "var(--text-primary)" }}>
                        {studentName}
                      </h2>
                      <span
                        className="rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.5px]"
                        style={{ background: riskStyle.bg, color: riskStyle.color }}
                      >
                        {risk}
                      </span>
                      <span className="flex items-center gap-1 text-[12px]" style={{ color: trendColor }}>
                        <TrendIcon size={14} /> {trend}
                      </span>
                    </div>
                    {studentClass && (
                      <p className="mt-0.5 text-[12px]" style={{ color: "var(--text-muted)" }}>
                        Class {studentClass}
                      </p>
                    )}
                    <p className="mt-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
                      {flagCount} flag{flagCount !== 1 ? "s" : ""} observed (last 14 days) ·{" "}
                      <span style={{ color: "var(--text-secondary)" }}>
                        {[...new Set(behaviorLogs.map((l) => CATEGORY_STYLES[l.category]?.label || l.category))].join(" & ")}
                      </span>
                    </p>

                    {/* Behavior chips */}
                    {topBehaviors.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {topBehaviors.map((b) => (
                          <span
                            key={b}
                            className="rounded-pill px-3 py-1 text-[11px]"
                            style={{ background: "var(--tag-bg)", color: "var(--text-secondary)", border: "1px solid var(--tag-border)" }}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pattern Timeline */}
              {behaviorLogs.length > 0 && (
                <div className="glass-card p-5" style={{ borderRadius: "20px" }}>
                  <h3 className="font-heading text-[16px] font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                    Pattern Timeline
                  </h3>
                  <div className="space-y-3">
                    {behaviorLogs.map((log, idx) => {
                      const catStyle = CATEGORY_STYLES[log.category];
                      const sevStyle = SEVERITY_STYLES[log.severity];
                      const dayNum = Math.ceil(
                        (new Date(log.date).getTime() - new Date(behaviorLogs[0].date).getTime()) / 86400000
                      ) + 1;
                      return (
                        <div key={log.id} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className="flex h-6 w-14 flex-shrink-0 items-center justify-center rounded-[8px] text-[10px] font-semibold"
                              style={{ background: "var(--input-bg)", color: "var(--text-muted)" }}
                            >
                              Day {dayNum}
                            </div>
                            {idx < behaviorLogs.length - 1 && (
                              <div className="mt-1 h-4 w-px" style={{ background: "var(--border-card)" }} />
                            )}
                          </div>
                          <div
                            className="flex-1 flex items-center justify-between rounded-[12px] px-3 py-2.5"
                            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="flex h-5 w-5 items-center justify-center rounded-full"
                                style={{ background: sevStyle.bg, color: sevStyle.color }}
                              >
                                {CATEGORY_ICONS[log.category]}
                              </div>
                              <span className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
                                {log.notes.slice(0, 40)}{log.notes.length > 40 ? "..." : ""}
                              </span>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                {formatDate(log.date)}
                              </p>
                              <span
                                className="text-[9px] font-medium"
                                style={{ color: sevStyle.color }}
                              >
                                {log.severity}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Teacher Observations */}
              <div className="glass-card p-5" style={{ borderRadius: "20px" }}>
                <h3 className="font-heading text-[16px] font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                  Teacher Observations
                </h3>
                {behaviorLogs.length === 0 ? (
                  <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>No observations logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {behaviorLogs.map((log) => {
                      const catStyle = CATEGORY_STYLES[log.category];
                      const sevStyle = SEVERITY_STYLES[log.severity];
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
                            {CATEGORY_ICONS[log.category]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                                {formatDate(log.date)}
                              </span>
                              <span
                                className="rounded-pill px-2 py-0.5 text-[9px] font-medium"
                                style={{ background: catStyle.bg, color: catStyle.color }}
                              >
                                {catStyle.label}
                              </span>
                              <span
                                className="rounded-pill px-2 py-0.5 text-[9px] font-medium"
                                style={{ background: sevStyle.bg, color: sevStyle.color }}
                              >
                                {log.severity}
                              </span>
                            </div>
                            <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                              {log.notes}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Counsellor Insights */}
              <div className="glass-card p-5" style={{ borderRadius: "20px" }}>
                <h3 className="font-heading text-[16px] font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                  Counsellor Insights
                </h3>
                {consultations.filter((c) => c.notes || c.summary).length === 0 ? (
                  <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>No session notes recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {consultations
                      .filter((c) => c.notes || c.summary)
                      .map((c) => (
                        <div
                          key={c.id}
                          className="rounded-[14px] p-3"
                          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <Calendar size={12} style={{ color: "var(--text-muted)" }} />
                            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                              {formatDate(c.date)} · {c.time}
                            </span>
                            <span
                              className="rounded-pill px-2 py-0.5 text-[9px] font-medium"
                              style={{ background: "rgba(74,222,128,0.1)", color: "#4ADE80" }}
                            >
                              {c.status}
                            </span>
                          </div>
                          {c.summary && (
                            <p className="text-[12px] mb-1" style={{ color: "var(--text-secondary)" }}>
                              <span className="font-medium" style={{ color: "var(--accent-primary)" }}>Summary: </span>
                              {c.summary}
                            </p>
                          )}
                          {c.notes && (
                            <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                              {c.notes}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN — Key Observations, Triggers, Insight */}
            <div className="space-y-5">
              {/* Key Observations */}
              <div
                className="rounded-[20px] p-5"
                style={{ background: "rgba(255,217,61,0.06)", border: "1px solid rgba(255,217,61,0.15)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={16} style={{ color: "#FFD93D" }} />
                  <h3 className="font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                    Key Observations
                  </h3>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {behaviorLogs.length > 0
                    ? `Pattern of ${[...new Set(behaviorLogs.map((l) => CATEGORY_STYLES[l.category]?.label.toLowerCase() || "behavioural"))].join(" and ")} observations over the past ${daysSinceFirst(behaviorLogs)} days. ${
                        risk === "HIGH"
                          ? "High-severity incidents present. Immediate counsellor attention recommended."
                          : risk === "MEDIUM"
                          ? "Moderate concerns noted. Regular counsellor check-in advised."
                          : "Low-level concerns. Continue monitoring."
                      }`
                    : "No behavioral data recorded for this student yet."}
                </p>
              </div>

              {/* Triggers / Context Tags */}
              {triggerTags.length > 0 && (
                <div className="glass-card p-5" style={{ borderRadius: "20px" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={15} style={{ color: "var(--accent-primary)" }} />
                    <h3 className="font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      Triggers / Context Tags
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {triggerTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-pill px-3 py-1.5 text-[11px] font-medium"
                        style={{ background: "var(--tag-bg)", color: "var(--text-secondary)", border: "1px solid var(--tag-border)" }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* System Insight */}
              <div
                className="rounded-[20px] p-5"
                style={{ background: "rgba(111,255,233,0.04)", border: "1px solid rgba(111,255,233,0.12)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} style={{ color: "var(--accent-primary)" }} />
                    <h3 className="font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      System Insight
                    </h3>
                  </div>
                </div>
                <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {trend === "Increasing" ? "Escalation Pattern: " : "Observation: "}
                  </span>
                  {systemInsight}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="glass-card p-5" style={{ borderRadius: "20px" }}>
                <h3 className="font-heading text-[14px] font-semibold mb-4" style={{ color: "var(--text-muted)" }}>
                  QUICK STATS
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Total Logs</span>
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{behaviorLogs.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Sessions</span>
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{consultations.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Risk Level</span>
                    <span className="font-semibold" style={{ color: riskStyle.color }}>{risk}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Trend</span>
                    <span className="flex items-center gap-1 font-semibold" style={{ color: trendColor }}>
                      <TrendIcon size={12} /> {trend}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Flags (14d)</span>
                    <span className="font-semibold" style={{ color: flagCount > 2 ? "#FF6B6B" : "var(--text-primary)" }}>
                      {flagCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => router.push(`/admin/schedule`)}
                className="cta-button flex w-full items-center justify-center gap-2"
              >
                <Calendar size={14} /> Schedule Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
