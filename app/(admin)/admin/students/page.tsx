"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import {
  getOrgMembersApi,
  listAssignmentsApi,
  assignStudentApi,
  unassignStudentApi,
} from "@/lib/organizations";
import {
  Users, Flag, Search, X, UserCheck, UserPlus,
  ChevronDown, ChevronUp, Calendar, BookOpen, Heart, Brain, Check,
} from "lucide-react";

interface Member {
  id: number;
  role: string;
  class?: string | null;
  creditBalance: number;
  user: { id: number; name: string; email: string; status: string };
  assignedTo: Array<{
    counsellorMemberId: number;
    counsellorMember: { id: number; user: { id: number; name: string } };
  }>;
}

interface BehaviorLog {
  id: number;
  date: string;
  category: string;
  severity: string;
  notes: string;
  flagForCounseling: boolean;
  counselingStatus: string;
}

interface Assignment {
  studentMemberId: number;
  counsellorMemberId: number;
  studentMember: { id: number; user: { id: number; name: string; email: string } };
  counsellorMember: { id: number; user: { id: number; name: string } };
}

const SEV_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  LOW: { bg: "rgba(74,222,128,0.1)", color: "#4ADE80", border: "rgba(74,222,128,0.15)" },
  MODERATE: { bg: "rgba(255,217,61,0.1)", color: "#FFD93D", border: "rgba(255,217,61,0.15)" },
  HIGH: { bg: "rgba(251,146,60,0.1)", color: "#FB923C", border: "rgba(251,146,60,0.15)" },
  CRITICAL: { bg: "rgba(255,107,107,0.1)", color: "#FF6B6B", border: "rgba(255,107,107,0.15)" },
};

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  ACADEMIC: { bg: "rgba(111,255,233,0.1)", color: "#6FFFE9" },
  SOCIAL: { bg: "rgba(167,139,250,0.1)", color: "#A78BFA" },
  EMOTIONAL: { bg: "rgba(255,107,107,0.1)", color: "#FF6B6B" },
  BEHAVIORAL: { bg: "rgba(255,217,61,0.1)", color: "#FFD93D" },
};

const CAT_ICONS: Record<string, React.ReactNode> = {
  ACADEMIC: <BookOpen size={11} />,
  SOCIAL: <Users size={11} />,
  EMOTIONAL: <Heart size={11} />,
  BEHAVIORAL: <Brain size={11} />,
};

export default function AdminStudentsPage() {
  const router = useRouter();
  const { memberships, memberRole, isAdmin } = useAuthStore();
  const orgId = memberships[0]?.organization?.id;
  const myMemberId = memberships[0]?.id;
  const isCounsellor = memberRole === "COUNSELLOR";
  const isTeacher = memberRole === "TEACHER";
  const myClass = isTeacher ? memberships[0]?.class : undefined;

  const [members, setMembers] = useState<Member[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [counsellorMembers, setCounsellorMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [behaviorLogs, setBehaviorLogs] = useState<Record<number, BehaviorLog[]>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [severityFilter, setSeverityFilter] = useState("ALL");

  // Assignment modal
  const [assignModal, setAssignModal] = useState<Member | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (orgId) fetchAll();
  }, [orgId]);

  async function fetchAll() {
    setLoading(true);
    try {
      const params: any = { role: "STUDENT", limit: 300 };
      // Teachers see only their class, counsellors see assigned students
      if (myClass) params.class = myClass;
      if (isCounsellor && myMemberId) params.counsellorMemberId = myMemberId;

      const [membersRes, assignRes, counsellorsRes] = await Promise.all([
        getOrgMembersApi(orgId!, params),
        !isCounsellor ? listAssignmentsApi(orgId!) : Promise.resolve({ data: [] }),
        !isCounsellor ? getOrgMembersApi(orgId!, { role: "COUNSELLOR", limit: 50 }) : Promise.resolve({ data: [] }),
      ]);

      const memberList: Member[] = membersRes.data || [];
      setMembers(memberList);
      setAssignments(assignRes.data || []);
      setCounsellorMembers(counsellorsRes.data || []);

      // Batch fetch behavior logs for all students in one call
      if (memberList.length > 0) {
        try {
          const logsRes = await api.get("/behavior-logs", {
            params: { orgId, limit: 1000 },
          });
          const allLogs: Array<BehaviorLog & { studentId: number }> = logsRes.data.data || [];
          const byStudent: Record<number, BehaviorLog[]> = {};
          allLogs.forEach((log) => {
            if (!byStudent[log.studentId]) byStudent[log.studentId] = [];
            byStudent[log.studentId].push(log);
          });
          setBehaviorLogs(byStudent);
        } catch {
          setBehaviorLogs({});
        }
      }
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  // Derive unique class options from member data
  const classOptions = useMemo(() => {
    const classes = new Set<string>();
    members.forEach((m) => { if (m.class) classes.add(m.class); });
    return Array.from(classes).sort();
  }, [members]);

  // Client-side filter
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const logs = behaviorLogs[m.user.id] || [];
      const hasFlagged = logs.some((l) => l.flagForCounseling);
      const maxSev = logs.reduce((acc, l) => {
        const order = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4 };
        return (order[l.severity as keyof typeof order] || 0) > (order[acc as keyof typeof order] || 0) ? l.severity : acc;
      }, "LOW");

      if (search && !m.user.name.toLowerCase().includes(search.toLowerCase()) &&
          !m.user.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (classFilter !== "ALL" && m.class !== classFilter) return false;
      if (flaggedOnly && !hasFlagged) return false;
      if (severityFilter !== "ALL" && maxSev !== severityFilter) return false;
      return true;
    });
  }, [members, behaviorLogs, search, classFilter, flaggedOnly, severityFilter]);

  function getAssignedCounsellor(memberId: number) {
    return assignments.find((a) => a.studentMemberId === memberId);
  }

  async function handleAssign(counsellorMemberId: number) {
    if (!assignModal || !orgId) return;
    setAssigning(true);
    try {
      await assignStudentApi(orgId, assignModal.id, counsellorMemberId);
      await fetchAll();
      setAssignModal(null);
    } catch {
      // silent
    } finally {
      setAssigning(false);
    }
  }

  async function handleUnassign(studentMemberId: number, counsellorMemberId: number) {
    if (!orgId) return;
    try {
      await unassignStudentApi(orgId, studentMemberId, counsellorMemberId);
      await fetchAll();
    } catch {
      // silent
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  const flaggedCount = useMemo(() =>
    members.filter((m) => (behaviorLogs[m.user.id] || []).some((l) => l.flagForCounseling)).length,
    [members, behaviorLogs]);

  if (!orgId) {
    return (
      <div>
        <AdminTopbar title="Students" subtitle="No organization found" />
        <div className="p-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
          Join an organization to view students.
        </div>
      </div>
    );
  }

  const title = isCounsellor ? "My Caseload" : "Students";
  const subtitle = isCounsellor
    ? `${members.length} assigned student${members.length !== 1 ? "s" : ""}`
    : myClass
      ? `Class ${myClass} · ${members.length} students`
      : `${members.length} students in your organisation`;

  return (
    <div>
      <AdminTopbar title={title} subtitle={subtitle} />

      <div className="p-8">
        {/* KPIs */}
        {!loading && members.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KPICard icon={<Users size={16} />} label="Total" value={members.length} color="#6FFFE9" />
            <KPICard icon={<Flag size={16} />} label="Flagged" value={flaggedCount} color="#FF6B6B" />
            {!isCounsellor && (
              <KPICard icon={<UserCheck size={16} />} label="Assigned" value={assignments.length} color="#4ADE80" />
            )}
            {!isCounsellor && (
              <KPICard icon={<Users size={16} />} label="Unassigned"
                value={members.filter(m => !getAssignedCounsellor(m.id)).length} color="#FFD93D" />
            )}
          </div>
        )}

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="input-field pl-9 py-2.5 text-[12px]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Class filter */}
          {classOptions.length > 0 && (
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="input-field py-2.5 text-[12px]"
              style={{ width: "auto", minWidth: "130px" }}
            >
              <option value="ALL">All Classes</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          )}

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="input-field py-2.5 text-[12px]"
            style={{ width: "auto", minWidth: "130px" }}
          >
            <option value="ALL">Any Severity</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </select>

          {/* Flagged toggle */}
          <button
            onClick={() => setFlaggedOnly(!flaggedOnly)}
            className="flex items-center gap-2 rounded-pill px-4 py-2.5 text-[11px] font-medium transition-all"
            style={{
              background: flaggedOnly ? "rgba(255,107,107,0.15)" : "var(--bg-card)",
              border: `1px solid ${flaggedOnly ? "rgba(255,107,107,0.3)" : "var(--border-card)"}`,
              color: flaggedOnly ? "#FF6B6B" : "var(--text-muted)",
            }}
          >
            <Flag size={12} /> Flagged only
          </button>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="mb-4 text-[11px]" style={{ color: "var(--text-muted)" }}>
            Showing {filtered.length} of {members.length} students
          </p>
        )}

        {loading && (
          <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>Loading…</div>
        )}

        {/* Student list */}
        <div className="space-y-2">
          {filtered.map((m) => {
            const logs = behaviorLogs[m.user.id] || [];
            const hasFlagged = logs.some((l) => l.flagForCounseling);
            const isExpanded = expandedId === m.id;
            const assignment = getAssignedCounsellor(m.id);
            const sevs = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4 };
            const worstLog = logs.reduce<BehaviorLog | null>((worst, l) =>
              !worst || (sevs[l.severity as keyof typeof sevs] > sevs[worst.severity as keyof typeof sevs]) ? l : worst, null);

            return (
              <div key={m.id} className="glass-card overflow-hidden" style={{ borderRadius: "18px" }}>
                <div className="flex items-center gap-3 p-4">
                  {/* Avatar */}
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] text-[14px] font-bold"
                    style={{ background: "var(--gradient-cta)", color: "#0B0C10" }}
                  >
                    {m.user.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {m.user.name}
                      </span>
                      {hasFlagged && (
                        <span className="rounded-pill px-1.5 py-0.5 text-[8px] font-medium uppercase"
                          style={{ background: "rgba(255,107,107,0.12)", color: "#FF6B6B", border: "1px solid rgba(255,107,107,0.2)" }}>
                          Flagged
                        </span>
                      )}
                      {worstLog && worstLog.severity !== "LOW" && (
                        <span className="rounded-pill px-1.5 py-0.5 text-[8px] font-medium uppercase"
                          style={{ background: SEV_COLORS[worstLog.severity]?.bg, color: SEV_COLORS[worstLog.severity]?.color, border: `1px solid ${SEV_COLORS[worstLog.severity]?.border}` }}>
                          {worstLog.severity}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {m.user.email}{m.class ? ` · Class ${m.class}` : ""}
                      {assignment && ` · 👤 ${assignment.counsellorMember.user.name}`}
                    </p>
                  </div>

                  {/* Stat */}
                  <div className="hidden flex-col items-center sm:flex" style={{ minWidth: 36 }}>
                    <span className="text-[13px] font-bold" style={{ color: "var(--accent-primary)" }}>{logs.length}</span>
                    <span className="text-[9px] uppercase tracking-[1px]" style={{ color: "var(--text-muted)" }}>Logs</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {!isCounsellor && (
                      <button
                        onClick={() => setAssignModal(m)}
                        className="flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 text-[10px] font-medium"
                        style={{
                          background: assignment ? "rgba(74,222,128,0.1)" : "rgba(111,255,233,0.08)",
                          border: `1px solid ${assignment ? "rgba(74,222,128,0.2)" : "rgba(111,255,233,0.15)"}`,
                          color: assignment ? "#4ADE80" : "var(--accent-primary)",
                        }}
                      >
                        {assignment ? <UserCheck size={11} /> : <UserPlus size={11} />}
                        <span className="hidden sm:inline">{assignment ? "Assigned" : "Assign"}</span>
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/admin/clients/${m.user.id}`)}
                      className="rounded-[10px] px-2.5 py-1.5 text-[10px] font-medium"
                      style={{ background: "rgba(167,139,250,0.1)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.15)" }}
                    >
                      Profile
                    </button>
                    {logs.length > 0 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : m.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-[8px]"
                        style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", color: "var(--text-muted)" }}
                      >
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded logs */}
                {isExpanded && logs.length > 0 && (
                  <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "var(--border-card)" }}>
                    <p className="mb-2 text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                      Recent behavior logs
                    </p>
                    <div className="space-y-2">
                      {logs.slice(0, 5).map((log) => {
                        const cat = CAT_COLORS[log.category] || CAT_COLORS.ACADEMIC;
                        const sev = SEV_COLORS[log.severity] || SEV_COLORS.LOW;
                        return (
                          <div key={log.id} className="flex items-start gap-2 rounded-[12px] p-3"
                            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}>
                            <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[7px]"
                              style={{ background: cat.bg, color: cat.color }}>
                              {CAT_ICONS[log.category] || <BookOpen size={11} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="rounded-pill px-1.5 py-0.5 text-[8px] font-medium uppercase"
                                  style={{ background: cat.bg, color: cat.color }}>{log.category}</span>
                                <span className="rounded-pill px-1.5 py-0.5 text-[8px] font-medium uppercase"
                                  style={{ background: sev.bg, color: sev.color }}>{log.severity}</span>
                                {log.flagForCounseling && (
                                  <span className="rounded-pill px-1.5 py-0.5 text-[8px] font-medium"
                                    style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>Flagged</span>
                                )}
                                <span className="ml-auto flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                                  <Calendar size={9} /> {formatDate(log.date)}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-[11px]" style={{ color: "var(--text-secondary)" }}>{log.notes}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center">
            <Users size={28} style={{ color: "var(--text-muted)", margin: "0 auto 10px" }} />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              {members.length === 0 ? "No students in your organisation yet." : "No students match the current filters."}
            </p>
          </div>
        )}
      </div>

      {/* Assign Counsellor Modal */}
      {assignModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setAssignModal(null)}
        >
          <div
            className="glass-card w-full max-w-sm p-6"
            style={{ borderRadius: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Assign Counsellor
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{assignModal.user.name}</p>
              </div>
              <button onClick={() => setAssignModal(null)} style={{ color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            {counsellorMembers.length === 0 ? (
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                No counsellors found in this organisation. Add counsellors via Bulk Register first.
              </p>
            ) : (
              <div className="space-y-2">
                {counsellorMembers.map((c) => {
                  const currentAssignment = assignments.find(
                    (a) => a.studentMemberId === assignModal.id && a.counsellorMemberId === c.id,
                  );
                  return (
                    <div key={c.id} className="flex items-center justify-between rounded-[14px] p-3"
                      style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[12px] font-bold"
                          style={{ background: "rgba(111,255,233,0.1)", color: "var(--accent-primary)" }}>
                          {c.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{c.user.name}</p>
                          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            {assignments.filter((a) => a.counsellorMemberId === c.id).length} students
                          </p>
                        </div>
                      </div>
                      {currentAssignment ? (
                        <button
                          onClick={() => handleUnassign(assignModal.id, c.id)}
                          disabled={assigning}
                          className="flex items-center gap-1 rounded-[10px] px-3 py-1.5 text-[10px] font-medium"
                          style={{ background: "rgba(74,222,128,0.1)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.2)" }}
                        >
                          <Check size={11} /> Assigned
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAssign(c.id)}
                          disabled={assigning}
                          className="rounded-[10px] px-3 py-1.5 text-[10px] font-medium"
                          style={{ background: "rgba(111,255,233,0.1)", color: "var(--accent-primary)", border: "1px solid rgba(111,255,233,0.15)" }}
                        >
                          Assign
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="glass-card p-4" style={{ borderRadius: "18px" }}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[11px]"
          style={{ background: `${color}18`, color }}>
          {icon}
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>{label}</p>
          <p className="text-[22px] font-bold leading-tight" style={{ color }}>{value}</p>
        </div>
      </div>
    </div>
  );
}
