"use client";

import { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import {
  Plus,
  X,
  ClipboardList,
  BookOpen,
  Trash2,
  Pencil,
  Calendar,
  AlertTriangle,
  ChevronDown,
  Users,
  User,
  Building,
  Target,
} from "lucide-react";

interface AssignmentEntry {
  id: number;
  type: string;
  questionnaireId: number | null;
  theorySessionId: number | null;
  targetType: string;
  targetValue: string | null;
  title: string;
  description: string | null;
  deadline: string | null;
  mandatory: boolean;
  status: string;
  createdAt: string;
  assignedBy: { id: number; name: string };
}

interface QuestionnaireOption {
  id: number;
  title: string;
}

interface TheoryOption {
  id: number;
  title: string;
}

const TYPE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  ASSESSMENT: { bg: "rgba(111,255,233,0.1)", color: "#6FFFE9", border: "rgba(111,255,233,0.15)" },
  THEORY: { bg: "rgba(167,139,250,0.1)", color: "#A78BFA", border: "rgba(167,139,250,0.15)" },
};

const TARGET_ICONS: Record<string, React.ReactNode> = {
  ALL: <Users size={14} />,
  CLASS: <Building size={14} />,
  DEPARTMENT: <Building size={14} />,
  INDIVIDUAL: <User size={14} />,
};

export default function AdminAssignmentsPage() {
  const memberships = useAuthStore((s) => s.memberships);
  const orgId = memberships?.[0]?.organization?.id;

  const [assignments, setAssignments] = useState<AssignmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dropdowns data
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireOption[]>([]);
  const [theorySessions, setTheorySessions] = useState<TheoryOption[]>([]);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    type: "ASSESSMENT" as string,
    questionnaireId: "",
    theorySessionId: "",
    targetType: "ALL" as string,
    targetValue: "",
    deadline: "",
    mandatory: false,
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (orgId) {
      fetchAssignments();
      fetchQuestionnaires();
      fetchTheorySessions();
    }
  }, [orgId]);

  async function fetchAssignments() {
    setLoading(true);
    try {
      const res = await api.get("/assignments", { params: { orgId, limit: 100 } });
      setAssignments(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  }

  async function fetchQuestionnaires() {
    try {
      const res = await api.get("/questionnaires", { params: { published: "true" } });
      setQuestionnaires(
        (res.data.data || []).map((q: any) => ({ id: q.id, title: q.title }))
      );
    } catch {
      setQuestionnaires([]);
    }
  }

  async function fetchTheorySessions() {
    try {
      const res = await api.get("/theory-sessions", { params: { status: "published" } });
      setTheorySessions(
        (res.data.data || []).map((t: any) => ({ id: t.id, title: t.title }))
      );
    } catch {
      setTheorySessions([]);
    }
  }

  function openCreateForm() {
    setEditingId(null);
    setFormData({
      title: "",
      type: "ASSESSMENT",
      questionnaireId: "",
      theorySessionId: "",
      targetType: "ALL",
      targetValue: "",
      deadline: "",
      mandatory: false,
      description: "",
    });
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(a: AssignmentEntry) {
    setEditingId(a.id);
    setFormData({
      title: a.title,
      type: a.type,
      questionnaireId: a.questionnaireId ? String(a.questionnaireId) : "",
      theorySessionId: a.theorySessionId ? String(a.theorySessionId) : "",
      targetType: a.targetType,
      targetValue: a.targetValue || "",
      deadline: a.deadline ? a.deadline.split("T")[0] : "",
      mandatory: a.mandatory,
      description: a.description || "",
    });
    setFormError("");
    setShowForm(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const payload: any = {
        title: formData.title,
        type: formData.type,
        targetType: formData.targetType,
        mandatory: formData.mandatory,
      };

      if (formData.description) payload.description = formData.description;
      if (formData.deadline) payload.deadline = formData.deadline;
      if (formData.targetType !== "ALL" && formData.targetValue) {
        payload.targetValue = formData.targetValue;
      }

      if (formData.type === "ASSESSMENT") {
        if (!formData.questionnaireId) {
          setFormError("Please select a questionnaire");
          setSaving(false);
          return;
        }
        payload.questionnaireId = parseInt(formData.questionnaireId);
      } else {
        if (!formData.theorySessionId) {
          setFormError("Please select a theory session");
          setSaving(false);
          return;
        }
        payload.theorySessionId = parseInt(formData.theorySessionId);
      }

      if (editingId) {
        await api.put(`/assignments/${editingId}`, payload);
      } else {
        await api.post("/assignments", payload, { params: { orgId } });
      }

      setShowForm(false);
      fetchAssignments();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to save assignment");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await api.delete(`/assignments/${id}`);
      fetchAssignments();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete assignment");
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getTargetLabel(a: AssignmentEntry) {
    if (a.targetType === "ALL") return "All Members";
    if (a.targetType === "CLASS") return `Class ${a.targetValue}`;
    if (a.targetType === "DEPARTMENT") return `Dept: ${a.targetValue}`;
    if (a.targetType === "INDIVIDUAL") return `User #${a.targetValue}`;
    return a.targetType;
  }

  const activeAssignments = assignments.filter((a) => a.status === "ACTIVE");
  const inactiveAssignments = assignments.filter((a) => a.status === "INACTIVE");

  if (!orgId) {
    return (
      <div>
        <AdminTopbar title="Assignments" subtitle="Assign assessments and theory sessions" />
        <div className="p-8">
          <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            No organization membership found. You need to be part of an organization to manage assignments.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminTopbar title="Assignments" subtitle="Assign assessments and theory sessions to members" />

      <div className="p-8">
        {/* Header + Create button */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {activeAssignments.length} active assignment{activeAssignments.length !== 1 ? "s" : ""}
          </p>
          <button
            onClick={openCreateForm}
            className="cta-button flex items-center gap-2"
            style={{ width: "auto", padding: "10px 20px" }}
          >
            <Plus size={16} />
            Create Assignment
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
            Loading assignments...
          </div>
        )}

        {/* Active Assignments */}
        {!loading && (
          <div className="space-y-3">
            {activeAssignments.map((a) => {
              const typeStyle = TYPE_STYLES[a.type] || TYPE_STYLES.ASSESSMENT;

              return (
                <div key={a.id} className="glass-card p-5" style={{ borderRadius: "20px" }}>
                  <div className="flex items-start gap-3">
                    {/* Type icon */}
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]"
                      style={{ background: typeStyle.bg, color: typeStyle.color }}
                    >
                      {a.type === "ASSESSMENT" ? <ClipboardList size={14} /> : <BookOpen size={14} />}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                            {a.title}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                              by {a.assignedBy.name}
                            </span>
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                              {"\u00B7"}
                            </span>
                            <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                              <Calendar size={9} /> {formatDate(a.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditForm(a)}
                            className="flex h-8 w-8 items-center justify-center rounded-[10px] transition-colors"
                            style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-[10px] transition-colors"
                            style={{ background: "rgba(255,107,107,0.08)", color: "#FF6B6B" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Description preview */}
                      {a.description && (
                        <p className="mt-2 line-clamp-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                          {a.description}
                        </p>
                      )}

                      {/* Tags row */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className="tag"
                          style={{ background: typeStyle.bg, color: typeStyle.color, borderColor: typeStyle.border }}
                        >
                          {a.type}
                        </span>

                        <span
                          className="inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[9px] font-medium"
                          style={{
                            background: "rgba(96,165,250,0.1)",
                            color: "#60A5FA",
                            border: "1px solid rgba(96,165,250,0.15)",
                          }}
                        >
                          {TARGET_ICONS[a.targetType]} {getTargetLabel(a)}
                        </span>

                        {a.mandatory && (
                          <span
                            className="inline-block rounded-pill px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide"
                            style={{
                              background: "rgba(255,107,107,0.1)",
                              color: "#FF6B6B",
                              border: "1px solid rgba(255,107,107,0.15)",
                            }}
                          >
                            Mandatory
                          </span>
                        )}

                        {a.deadline && (
                          <span
                            className="inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[9px] font-medium"
                            style={{
                              background: "rgba(255,217,61,0.1)",
                              color: "#FFD93D",
                              border: "1px solid rgba(255,217,61,0.15)",
                            }}
                          >
                            <Calendar size={9} /> Due {formatDate(a.deadline)}
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

        {/* Inactive section */}
        {!loading && inactiveAssignments.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-3 text-[12px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
              Inactive
            </h3>
            <div className="space-y-3">
              {inactiveAssignments.map((a) => {
                const typeStyle = TYPE_STYLES[a.type] || TYPE_STYLES.ASSESSMENT;
                return (
                  <div key={a.id} className="glass-card p-4 opacity-50" style={{ borderRadius: "20px" }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px]"
                        style={{ background: typeStyle.bg, color: typeStyle.color }}
                      >
                        {a.type === "ASSESSMENT" ? <ClipboardList size={12} /> : <BookOpen size={12} />}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                          {a.title}
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          {a.type} &middot; {getTargetLabel(a)} &middot; Deleted
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && assignments.length === 0 && (
          <div className="py-12 text-center">
            <Target size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              No assignments yet. Click &ldquo;Create Assignment&rdquo; to get started.
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div
            className="glass-card mx-4 w-full max-w-lg overflow-y-auto p-6"
            style={{ borderRadius: "20px", maxHeight: "85vh" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-[18px] font-semibold" style={{ color: "var(--text-primary)" }}>
                {editingId ? "Edit Assignment" : "Create Assignment"}
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
              {/* Title */}
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Weekly Anxiety Assessment"
                  required
                />
              </div>

              {/* Type */}
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  Type
                </label>
                <div className="relative">
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value, questionnaireId: "", theorySessionId: "" })}
                    className="input-field appearance-none pr-10"
                  >
                    <option value="ASSESSMENT">Assessment</option>
                    <option value="THEORY">Theory Session</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }}
                  />
                </div>
              </div>

              {/* Questionnaire or Theory dropdown */}
              {formData.type === "ASSESSMENT" ? (
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                    Questionnaire
                  </label>
                  <div className="relative">
                    <select
                      value={formData.questionnaireId}
                      onChange={(e) => setFormData({ ...formData, questionnaireId: e.target.value })}
                      className="input-field appearance-none pr-10"
                      required
                    >
                      <option value="">Select a questionnaire...</option>
                      {questionnaires.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)" }}
                    />
                  </div>
                  {questionnaires.length === 0 && (
                    <p className="mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                      No published questionnaires found.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                    Theory Session
                  </label>
                  <div className="relative">
                    <select
                      value={formData.theorySessionId}
                      onChange={(e) => setFormData({ ...formData, theorySessionId: e.target.value })}
                      className="input-field appearance-none pr-10"
                      required
                    >
                      <option value="">Select a theory session...</option>
                      {theorySessions.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)" }}
                    />
                  </div>
                  {theorySessions.length === 0 && (
                    <p className="mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                      No published theory sessions found.
                    </p>
                  )}
                </div>
              )}

              {/* Target Type */}
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  Assign To
                </label>
                <div className="relative">
                  <select
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value, targetValue: "" })}
                    className="input-field appearance-none pr-10"
                  >
                    <option value="ALL">All Members</option>
                    <option value="CLASS">Specific Class</option>
                    <option value="DEPARTMENT">Specific Department</option>
                    <option value="INDIVIDUAL">Individual User</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }}
                  />
                </div>
              </div>

              {/* Target Value (shown for non-ALL) */}
              {formData.targetType !== "ALL" && (
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                    {formData.targetType === "CLASS"
                      ? "Class Name"
                      : formData.targetType === "DEPARTMENT"
                      ? "Department Name"
                      : "User ID"}
                  </label>
                  <input
                    type="text"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                    className="input-field"
                    placeholder={
                      formData.targetType === "CLASS"
                        ? "e.g. 10-A"
                        : formData.targetType === "DEPARTMENT"
                        ? "e.g. Engineering"
                        : "e.g. 42"
                    }
                    required
                  />
                </div>
              )}

              {/* Deadline */}
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  Deadline (optional)
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Add details about this assignment..."
                />
              </div>

              {/* Mandatory checkbox */}
              <div
                className="flex items-center gap-3 rounded-[14px] p-4"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
              >
                <input
                  type="checkbox"
                  id="mandatory"
                  checked={formData.mandatory}
                  onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "#FF6B6B" }}
                />
                <label htmlFor="mandatory" className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  <AlertTriangle size={13} style={{ color: "#FFD93D" }} />
                  Mark as mandatory
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
                  {saving ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
