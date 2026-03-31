"use client";

import { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { Plus, X, AlertTriangle, BookOpen, Heart, Users, Brain, Flag, Calendar, ChevronDown } from "lucide-react";

interface Student {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  role: string;
  class?: string | null;
}

interface BehaviorLogEntry {
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

const CATEGORIES = ["ACADEMIC", "SOCIAL", "EMOTIONAL", "BEHAVIORAL"] as const;
const SEVERITIES = ["LOW", "MODERATE", "HIGH", "CRITICAL"] as const;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ACADEMIC: <BookOpen size={14} />,
  SOCIAL: <Users size={14} />,
  EMOTIONAL: <Heart size={14} />,
  BEHAVIORAL: <Brain size={14} />,
};

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

export default function AdminBehaviorLogPage() {
  const memberships = useAuthStore((s) => s.memberships);
  const orgId = memberships?.[0]?.organization?.id;
  const teacherClass = memberships?.[0]?.class;

  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<BehaviorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState("");

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    date: new Date().toISOString().split("T")[0],
    category: "ACADEMIC" as string,
    severity: "LOW" as string,
    notes: "",
    flagForCounseling: false,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (orgId) {
      fetchStudents();
      fetchLogs();
    }
  }, [orgId]);

  async function fetchStudents() {
    try {
      const res = await api.get(`/organizations/${orgId}/members`, {
        params: { role: "STUDENT", limit: 200 },
      });
      setStudents(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch students");
    }
  }

  async function fetchLogs() {
    setLogsLoading(true);
    try {
      const params: any = { limit: 50 };
      if (orgId) params.orgId = orgId;
      if (teacherClass) params.class = teacherClass;
      const res = await api.get("/behavior-logs", { params });
      setLogs(res.data.data || []);
    } catch (err: any) {
      // If the endpoint doesn't exist yet or returns an error, show empty
      setLogs([]);
    } finally {
      setLogsLoading(false);
      setLoading(false);
    }
  }

  function openAddForm() {
    setFormData({
      studentId: "",
      date: new Date().toISOString().split("T")[0],
      category: "ACADEMIC",
      severity: "LOW",
      notes: "",
      flagForCounseling: false,
    });
    setFormError("");
    setShowForm(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      if (!formData.studentId) {
        setFormError("Please select a student");
        setSaving(false);
        return;
      }

      await api.post("/behavior-logs", {
        studentId: parseInt(formData.studentId),
        date: formData.date,
        category: formData.category,
        severity: formData.severity,
        notes: formData.notes,
        flagForCounseling: formData.flagForCounseling,
      }, {
        params: { orgId },
      });

      setShowForm(false);
      fetchLogs();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to create behavior log");
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getCategoryStyle(category: string) {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.ACADEMIC;
  }

  function getSeverityStyle(severity: string) {
    return SEVERITY_COLORS[severity] || SEVERITY_COLORS.LOW;
  }

  // Filter students by teacher's class if available
  const filteredStudents = teacherClass
    ? students.filter((s) => s.class === teacherClass)
    : students;

  if (!orgId) {
    return (
      <div>
        <AdminTopbar title="Behavior Log" subtitle="Track and manage student behavior" />
        <div className="p-8">
          <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            No organization membership found. You need to be part of an organization to use the behavior log.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminTopbar title="Behavior Log" subtitle={teacherClass ? `Class ${teacherClass} \u2014 Track student behavior` : "Track and manage student behavior"} />

      <div className="p-8">
        {/* Header + New Entry button */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {logs.length} log entr{logs.length !== 1 ? "ies" : "y"} {teacherClass ? `for class ${teacherClass}` : "total"}
          </p>
          <button
            onClick={openAddForm}
            className="cta-button flex items-center gap-2"
            style={{ width: "auto", padding: "10px 20px" }}
          >
            <Plus size={16} />
            New Entry
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-card p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            Loading behavior logs...
          </div>
        )}

        {/* Logs List */}
        {!loading && (
          <div className="space-y-3">
            {logs.map((log) => {
              const catStyle = getCategoryStyle(log.category);
              const sevStyle = getSeverityStyle(log.severity);

              return (
                <div key={log.id} className="glass-card p-5" style={{ borderRadius: "20px" }}>
                  <div className="flex items-start gap-3">
                    {/* Category icon */}
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]"
                      style={{ background: catStyle.bg, color: catStyle.color }}
                    >
                      {CATEGORY_ICONS[log.category] || <BookOpen size={14} />}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                            {log.student.name}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                              by {log.teacher.name}
                            </span>
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                              \u00B7
                            </span>
                            <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                              <Calendar size={9} /> {formatDate(log.date)}
                            </span>
                          </div>
                        </div>

                        {/* Flag indicator */}
                        {log.flagForCounseling && (
                          <div
                            className="flex items-center gap-1 rounded-pill px-2 py-1"
                            style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.15)" }}
                          >
                            <Flag size={10} style={{ color: "#FF6B6B" }} />
                            <span className="text-[9px] font-medium uppercase tracking-[0.5px]" style={{ color: "#FF6B6B" }}>
                              Flagged
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Notes preview */}
                      <p className="mt-2 line-clamp-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        {log.notes}
                      </p>

                      {/* Tags */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
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
                        {log.counselingStatus !== "NONE" && (
                          <span
                            className="inline-block rounded-pill px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide"
                            style={{
                              background: log.counselingStatus === "COMPLETED" ? "rgba(74,222,128,0.1)" : "rgba(96,165,250,0.1)",
                              color: log.counselingStatus === "COMPLETED" ? "#4ADE80" : "#60A5FA",
                              border: `1px solid ${log.counselingStatus === "COMPLETED" ? "rgba(74,222,128,0.15)" : "rgba(96,165,250,0.15)"}`,
                            }}
                          >
                            Counseling: {log.counselingStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty */}
        {!loading && logs.length === 0 && (
          <div className="py-12 text-center">
            <AlertTriangle size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              No behavior logs found. Click &ldquo;New Entry&rdquo; to create one.
            </p>
          </div>
        )}
      </div>

      {/* New Entry Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div
            className="glass-card mx-4 w-full max-w-lg overflow-y-auto p-6"
            style={{ borderRadius: "20px", maxHeight: "85vh" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-[18px] font-semibold" style={{ color: "var(--text-primary)" }}>
                New Behavior Log Entry
              </h2>
              <button onClick={() => setShowForm(false)} style={{ color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-card p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Student Selector */}
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  Student
                </label>
                <div className="relative">
                  <select
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="input-field appearance-none pr-10"
                    required
                  >
                    <option value="">Select a student...</option>
                    {filteredStudents.map((s) => (
                      <option key={s.user.id} value={s.user.id}>
                        {s.user.name} {s.class ? `(Class ${s.class})` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }}
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0) + cat.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Severity */}
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                    Severity
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="input-field"
                  >
                    {SEVERITIES.map((sev) => (
                      <option key={sev} value={sev}>
                        {sev.charAt(0) + sev.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                  rows={4}
                  placeholder="Describe the behavior observation..."
                  required
                />
              </div>

              {/* Flag for Counseling */}
              <div
                className="flex items-center gap-3 rounded-[14px] p-4"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
              >
                <input
                  type="checkbox"
                  id="flagForCounseling"
                  checked={formData.flagForCounseling}
                  onChange={(e) => setFormData({ ...formData, flagForCounseling: e.target.checked })}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "#FF6B6B" }}
                />
                <label htmlFor="flagForCounseling" className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  <Flag size={13} style={{ color: "#FF6B6B" }} />
                  Flag for counseling referral
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-button border px-4 py-3 text-[13px] font-medium"
                  style={{ borderColor: "var(--accent-primary)", color: "var(--accent-primary)", background: "transparent" }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="cta-button flex-1">
                  {saving ? "Submitting..." : "Submit Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
