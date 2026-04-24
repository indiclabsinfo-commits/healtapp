"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { useAuthStore } from "@/stores/auth-store";
import { getAdminAnalyticsApi } from "@/lib/analytics";
import api from "@/lib/api";
import { listCounsellorsApi } from "@/lib/counsellors";
import { getCounsellorConsultationsApi } from "@/lib/consultations";
import {
  Users, Activity, UserCheck, TrendingUp, Flag, ClipboardList,
  Calendar, Clock, ChevronRight, BookOpen, Heart, Zap, AlertTriangle,
} from "lucide-react";

function KpiCard({ label, value, color, icon: Icon, loading }: {
  label: string; value: string | number; color: string; icon: any; loading?: boolean;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>{label}</p>
        <Icon size={16} style={{ color }} />
      </div>
      <p className="mt-2 font-heading text-[28px] font-bold" style={{ color }}>
        {loading ? "—" : value}
      </p>
    </div>
  );
}

/* ── SUPER ADMIN DASHBOARD ─────────────────────────────── */
function SuperAdminDashboard({ user }: { user: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminAnalyticsApi().then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: "Total Users", value: data?.totalUsers ?? 0, color: "#6FFFE9", icon: Users },
    { label: "Active Users", value: data?.activeUsers ?? 0, color: "#FF6B6B", icon: Activity },
    { label: "Counsellors", value: data?.totalCounsellors ?? 0, color: "#A78BFA", icon: UserCheck },
    { label: "Completion Rate", value: `${data?.completionRate ?? 0}%`, color: "#4ADE80", icon: TrendingUp },
  ];

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => <KpiCard key={k.label} {...k} loading={loading} />)}
      </div>
      {data && (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="glass-card p-5">
            <h3 className="mb-4 font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Recent Users</h3>
            <div className="space-y-3">
              {data.recentUsers?.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between rounded-[10px] p-3" style={{ background: "var(--input-bg)" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[11px] font-bold" style={{ background: "var(--tag-bg)", color: "var(--accent-primary)" }}>
                      {u.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{u.name}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{u.email}</p>
                    </div>
                  </div>
                  <span className="rounded-pill px-2 py-0.5 text-[9px] font-medium uppercase" style={{ background: u.status === "ACTIVE" ? "rgba(111,255,233,0.1)" : "rgba(255,107,107,0.1)", color: u.status === "ACTIVE" ? "var(--accent-primary)" : "#FF6B6B" }}>
                    {u.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-5">
            <h3 className="mb-4 font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Assessment Distribution</h3>
            {data.categoryDistribution?.length > 0 ? (
              <div className="space-y-3">
                {data.categoryDistribution.map((item: any, i: number) => {
                  const maxCount = Math.max(...data.categoryDistribution.map((d: any) => d.count));
                  const colors = ["#6FFFE9", "#FF6B6B", "#A78BFA", "#FFD93D"];
                  return (
                    <div key={i}>
                      <div className="mb-1 flex justify-between">
                        <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{item.category}</span>
                        <span className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{item.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--input-bg)" }}>
                        <div className="h-full rounded-full" style={{ width: `${(item.count / maxCount) * 100}%`, background: colors[i % colors.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No assessments taken yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ORG ADMIN DASHBOARD ───────────────────────────────── */
function OrgAdminDashboard({ user, orgId, orgName }: { user: any; orgId: number; orgName: string }) {
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [counsellors, setCounsellors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/organizations/${orgId}/members`, { params: { limit: 100 } }),
      listCounsellorsApi({ limit: 50 }),
    ]).then(([mRes, cRes]) => {
      setMembers(mRes.data.data || []);
      setCounsellors(cRes.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [orgId]);

  const students = members.filter((m) => m.role === "STUDENT");
  const teachers = members.filter((m) => m.role === "TEACHER");
  const admins = members.filter((m) => m.role === "ORG_ADMIN");

  const kpis = [
    { label: "Total Members", value: members.length, color: "#6FFFE9", icon: Users },
    { label: "Students", value: students.length, color: "#A78BFA", icon: BookOpen },
    { label: "Teachers", value: teachers.length, color: "#4ADE80", icon: UserCheck },
    { label: "Counsellors", value: counsellors.length, color: "#FFD93D", icon: Heart },
  ];

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => <KpiCard key={k.label} {...k} loading={loading} />)}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Members */}
        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Recent Members</h3>
            <button onClick={() => router.push("/admin/users")} className="flex items-center gap-1 text-[11px]" style={{ color: "var(--accent-primary)" }}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {members.slice(0, 6).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-[10px] px-3 py-2.5" style={{ background: "var(--input-bg)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[11px] font-bold" style={{ background: "var(--tag-bg)", color: "var(--accent-primary)" }}>
                    {m.user?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{m.user?.name}</p>
                    {m.class && <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Class {m.class}</p>}
                  </div>
                </div>
                <span className="rounded-pill px-2 py-0.5 text-[9px] font-medium" style={{ background: "var(--tag-bg)", color: "var(--text-secondary)" }}>
                  {m.role}
                </span>
              </div>
            ))}
            {members.length === 0 && !loading && (
              <p className="py-4 text-center text-[12px]" style={{ color: "var(--text-muted)" }}>No members yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-5">
          <h3 className="mb-4 font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: "Manage Members", icon: Users, href: "/admin/users", color: "#6FFFE9" },
              { label: "Manage Counsellors", icon: UserCheck, href: "/admin/counsellors", color: "#A78BFA" },
              { label: "View Analytics", icon: TrendingUp, href: "/admin/analytics", color: "#4ADE80" },
              { label: "Payout Dashboard", icon: Activity, href: "/admin/payouts", color: "#FFD93D" },
            ].map((a) => (
              <button key={a.href} onClick={() => router.push(a.href)}
                className="flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left transition-all hover:opacity-80"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}>
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: `${a.color}15`, color: a.color }}>
                  <a.icon size={15} />
                </div>
                <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{a.label}</span>
                <ChevronRight size={14} className="ml-auto" style={{ color: "var(--text-muted)" }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── TEACHER DASHBOARD ─────────────────────────────────── */
function TeacherDashboard({ user, orgId, teacherClass }: { user: any; orgId: number; teacherClass: string | null }) {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params: any = { role: "STUDENT", limit: 100 };
    Promise.all([
      api.get(`/organizations/${orgId}/members`, { params }),
      api.get("/behavior-logs", { params: { orgId, limit: 20 } }),
    ]).then(([mRes, lRes]) => {
      let all = mRes.data.data || [];
      if (teacherClass) all = all.filter((m: any) => m.class === teacherClass);
      setStudents(all);
      setLogs(lRes.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [orgId, teacherClass]);

  const flagged = logs.filter((l) => l.flagForCounseling).length;
  const highSeverity = logs.filter((l) => l.severity === "HIGH" || l.severity === "CRITICAL").length;

  const CATEGORY_COLORS: Record<string, string> = {
    ACADEMIC: "#60A5FA", SOCIAL: "#A78BFA", EMOTIONAL: "#F472B6", BEHAVIORAL: "#FBBF24",
  };
  const CATEGORY_ICONS: Record<string, any> = {
    ACADEMIC: BookOpen, SOCIAL: Users, EMOTIONAL: Heart, BEHAVIORAL: Zap,
  };

  const kpis = [
    { label: "My Students", value: students.length, color: "#6FFFE9", icon: Users },
    { label: "Behavior Logs", value: logs.length, color: "#A78BFA", icon: ClipboardList },
    { label: "Flagged", value: flagged, color: "#FF6B6B", icon: Flag },
    { label: "High Severity", value: highSeverity, color: "#FBBF24", icon: AlertTriangle },
  ];

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => <KpiCard key={k.label} {...k} loading={loading} />)}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Behavior Logs */}
        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Recent Behavior Logs</h3>
            <button onClick={() => router.push("/admin/behavior-log")} className="flex items-center gap-1 text-[11px]" style={{ color: "var(--accent-primary)" }}>
              Log New <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {logs.slice(0, 5).map((log) => {
              const Icon = CATEGORY_ICONS[log.category] || BookOpen;
              const color = CATEGORY_COLORS[log.category] || "#6FFFE9";
              return (
                <div key={log.id} className="flex items-start gap-3 rounded-[12px] p-3" style={{ background: "var(--input-bg)" }}>
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[8px]" style={{ background: `${color}15`, color }}>
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>
                        {log.student?.name || "Student"}
                      </span>
                      {log.flagForCounseling && (
                        <span className="rounded-full px-1.5 py-0.5 text-[8px] font-medium" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>Flagged</span>
                      )}
                    </div>
                    <p className="line-clamp-1 text-[11px]" style={{ color: "var(--text-muted)" }}>{log.notes}</p>
                  </div>
                  <span className="flex-shrink-0 text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {new Date(log.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
              );
            })}
            {logs.length === 0 && !loading && (
              <p className="py-4 text-center text-[12px]" style={{ color: "var(--text-muted)" }}>No behavior logs yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-5">
          <h3 className="mb-4 font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: "Notice a Change", icon: Flag, href: "/admin/notice-change", color: "#FF6B6B", desc: "Flag a student for counsellor support" },
              { label: "Log Behavior", icon: ClipboardList, href: "/admin/behavior-log", color: "#A78BFA", desc: "Record a student observation" },
              { label: "My Students", icon: Users, href: "/admin/students", color: "#6FFFE9", desc: teacherClass ? `Class ${teacherClass}` : "All students" },
              { label: "Class Wellness", icon: TrendingUp, href: "/admin/analytics", color: "#4ADE80", desc: "View wellness trends" },
            ].map((a) => (
              <button key={a.href} onClick={() => router.push(a.href)}
                className="flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left transition-all hover:opacity-80"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}>
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]" style={{ background: `${a.color}15`, color: a.color }}>
                  <a.icon size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{a.label}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{a.desc}</p>
                </div>
                <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── COUNSELLOR DASHBOARD ──────────────────────────────── */
function CounsellorDashboard({ user }: { user: any }) {
  const router = useRouter();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const cRes = await listCounsellorsApi({ limit: 100 });
        const counsellors = cRes.data || [];
        const matched = counsellors.find(
          (c: any) => user?.name && c.name.toLowerCase().includes(user.name.toLowerCase().split(" ")[0])
        ) || counsellors[0];
        if (matched) {
          const res = await getCounsellorConsultationsApi(matched.id, { limit: 100 });
          setConsultations(res.data || []);
        }
      } catch { } finally { setLoading(false); }
    }
    load();
  }, [user]);

  const today = new Date();
  const todaySessions = consultations.filter((c) => {
    const d = new Date(c.date);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate() && c.status === "BOOKED";
  });
  const upcomingSessions = consultations.filter((c) => {
    const d = new Date(c.date);
    const diff = (d.getTime() - today.getTime()) / 86400000;
    return diff > 0 && diff <= 7 && c.status === "BOOKED";
  });
  const completed = consultations.filter((c) => c.status === "COMPLETED");
  const withNotes = completed.filter((c) => c.notes || c.summary);

  const kpis = [
    { label: "Today's Sessions", value: todaySessions.length, color: "#6FFFE9", icon: Calendar },
    { label: "Upcoming (7d)", value: upcomingSessions.length, color: "#A78BFA", icon: Clock },
    { label: "Total Sessions", value: consultations.length, color: "#4ADE80", icon: UserCheck },
    { label: "With Notes", value: withNotes.length, color: "#FFD93D", icon: ClipboardList },
  ];

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => <KpiCard key={k.label} {...k} loading={loading} />)}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today + Upcoming */}
        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Today's Sessions
              <span className="ml-2 text-[12px] font-normal" style={{ color: "var(--text-muted)" }}>
                ({todaySessions.length})
              </span>
            </h3>
            <button onClick={() => router.push("/admin/schedule")} className="flex items-center gap-1 text-[11px]" style={{ color: "var(--accent-primary)" }}>
              Full Schedule <ChevronRight size={12} />
            </button>
          </div>
          {todaySessions.length === 0 ? (
            <div className="rounded-[14px] p-4 text-center" style={{ background: "var(--input-bg)" }}>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No sessions today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todaySessions.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-[12px] p-3" style={{ background: "var(--input-bg)" }}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[13px] font-bold" style={{ background: "var(--tag-bg)", color: "var(--accent-primary)" }}>
                    {c.user?.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{c.user?.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{c.time} · {c.duration} min</p>
                  </div>
                  <span className="rounded-pill px-2 py-0.5 text-[9px]" style={{ background: "rgba(111,255,233,0.1)", color: "#6FFFE9" }}>Booked</span>
                </div>
              ))}
            </div>
          )}

          {upcomingSessions.length > 0 && (
            <>
              <h4 className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                Upcoming (next 7 days)
              </h4>
              <div className="space-y-2">
                {upcomingSessions.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-[12px] p-3" style={{ background: "var(--input-bg)" }}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[12px] font-bold" style={{ background: "var(--tag-bg)", color: "var(--accent-primary)" }}>
                      {c.user?.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{c.user?.name}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {new Date(c.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {c.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recent Session Notes */}
        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Recent Notes</h3>
            <button onClick={() => router.push("/admin/clients")} className="flex items-center gap-1 text-[11px]" style={{ color: "var(--accent-primary)" }}>
              My Clients <ChevronRight size={12} />
            </button>
          </div>
          {withNotes.length === 0 ? (
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No session notes yet</p>
          ) : (
            <div className="space-y-3">
              {withNotes.slice(0, 4).map((c) => (
                <div key={c.id} className="rounded-[14px] p-3" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[11px] font-bold" style={{ background: "var(--tag-bg)", color: "var(--accent-primary)" }}>
                      {c.user?.name?.charAt(0)}
                    </div>
                    <span className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{c.user?.name}</span>
                    <span className="ml-auto text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {new Date(c.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    {c.summary || c.notes}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-2">
            {[
              { label: "My Schedule", href: "/admin/schedule", icon: Calendar, color: "#6FFFE9" },
              { label: "My Clients", href: "/admin/clients", icon: Users, color: "#A78BFA" },
              { label: "Flagged Students", href: "/admin/flagged", icon: Flag, color: "#FF6B6B" },
            ].map((a) => (
              <button key={a.href} onClick={() => router.push(a.href)}
                className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2.5 text-left"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}>
                <a.icon size={13} style={{ color: a.color }} />
                <span className="text-[12px]" style={{ color: "var(--text-primary)" }}>{a.label}</span>
                <ChevronRight size={12} className="ml-auto" style={{ color: "var(--text-muted)" }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN COMPONENT ────────────────────────────────────── */
export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const memberRole = useAuthStore((s) => s.memberRole);
  const memberships = useAuthStore((s) => s.memberships);
  const orgId = memberships?.[0]?.organization?.id;
  const orgName = memberships?.[0]?.organization?.name || "";
  const teacherClass = memberships?.[0]?.class || null;

  const firstName = user?.name?.split(" ")[0] || "there";

  let subtitle = `Welcome back, ${firstName}`;
  if (memberRole === "TEACHER") subtitle = `Welcome back, ${firstName} · ${orgName}`;
  if (memberRole === "ORG_ADMIN") subtitle = `Welcome back, ${firstName} · ${orgName}`;
  if (memberRole === "COUNSELLOR") subtitle = `Welcome back, ${firstName}`;

  return (
    <div>
      <AdminTopbar title="Dashboard" subtitle={subtitle} />
      {isAdmin && <SuperAdminDashboard user={user} />}
      {!isAdmin && memberRole === "ORG_ADMIN" && orgId && (
        <OrgAdminDashboard user={user} orgId={orgId} orgName={orgName} />
      )}
      {!isAdmin && memberRole === "TEACHER" && orgId && (
        <TeacherDashboard user={user} orgId={orgId} teacherClass={teacherClass} />
      )}
      {!isAdmin && memberRole === "COUNSELLOR" && (
        <CounsellorDashboard user={user} />
      )}
      {!isAdmin && !memberRole && <SuperAdminDashboard user={user} />}
    </div>
  );
}
