"use client";

import { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { listTheoryApi, createTheoryApi, updateTheoryApi, deleteTheoryApi } from "@/lib/theory";
import { Plus, Pencil, Trash2, X, BookOpen, Clock, GripVertical } from "lucide-react";

interface TheoryModule {
  title: string;
  content: string;
}

interface TheorySession {
  id: number;
  title: string;
  description: string;
  modules: TheoryModule[];
  duration: number;
  status: string;
  createdAt: string;
}

export default function AdminTheoryPage() {
  const [sessions, setSessions] = useState<TheorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form modal
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<TheorySession | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    status: "draft",
  });
  const [modules, setModules] = useState<TheoryModule[]>([{ title: "", content: "" }]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    setLoading(true);
    setError("");
    try {
      const result = await listTheoryApi({ limit: 50 });
      setSessions(result.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch theory sessions");
    } finally {
      setLoading(false);
    }
  }

  function openAddForm() {
    setEditingSession(null);
    setFormData({ title: "", description: "", duration: "", status: "draft" });
    setModules([{ title: "", content: "" }]);
    setFormError("");
    setShowForm(true);
  }

  function parseModules(raw: any): TheoryModule[] {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return []; }
    }
    return [];
  }

  function openEditForm(session: TheorySession) {
    setEditingSession(session);
    setFormData({
      title: session.title,
      description: session.description,
      duration: String(session.duration),
      status: session.status,
    });
    const parsedModules = parseModules(session.modules);
    setModules(parsedModules.length > 0 ? parsedModules : [{ title: "", content: "" }]);
    setFormError("");
    setShowForm(true);
  }

  function addModule() {
    setModules([...modules, { title: "", content: "" }]);
  }

  function removeModule(index: number) {
    if (modules.length <= 1) return;
    setModules(modules.filter((_, i) => i !== index));
  }

  function updateModule(index: number, field: keyof TheoryModule, value: string) {
    const updated = modules.map((m, i) => (i === index ? { ...m, [field]: value } : m));
    setModules(updated);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    // Validate modules
    const validModules = modules.filter((m) => m.title.trim());
    if (validModules.length === 0) {
      setFormError("At least one module with a title is required");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        modules: validModules,
        duration: parseInt(formData.duration) || 0,
        status: formData.status,
      };

      if (editingSession) {
        await updateTheoryApi(editingSession.id, payload);
      } else {
        await createTheoryApi(payload);
      }

      setShowForm(false);
      fetchSessions();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to save theory session");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this theory session?")) return;
    try {
      await deleteTheoryApi(id);
      fetchSessions();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete theory session");
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div>
      <AdminTopbar title="Theory Sessions" subtitle="Manage learning content and modules" />

      <div className="p-8">
        {/* Header + Add button */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} total
          </p>
          <button
            onClick={openAddForm}
            className="cta-button flex items-center gap-2"
            style={{ width: "auto", padding: "10px 20px" }}
          >
            <Plus size={16} />
            Add Session
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
            Loading theory sessions...
          </div>
        )}

        {/* Session Cards */}
        {!loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => {
              const moduleCount = parseModules(session.modules).length;
              return (
                <div key={session.id} className="glass-card p-5" style={{ borderRadius: "20px" }}>
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px]"
                      style={{ background: "rgba(167,139,250,0.1)", color: "#A78BFA" }}
                    >
                      <BookOpen size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {session.title}
                      </p>
                      <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {moduleCount} module{moduleCount !== 1 ? "s" : ""} · {session.duration} min
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p
                    className="mt-3 line-clamp-2 text-[12px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {session.description}
                  </p>

                  {/* Status + Date */}
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className="inline-block rounded-pill px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide"
                      style={{
                        background: session.status === "published" ? "rgba(74,222,128,0.1)" : "rgba(255,217,61,0.1)",
                        color: session.status === "published" ? "#4ADE80" : "#FFD93D",
                        border: `1px solid ${session.status === "published" ? "rgba(74,222,128,0.15)" : "rgba(255,217,61,0.15)"}`,
                      }}
                    >
                      {session.status}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {formatDate(session.createdAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div
                    className="mt-4 flex gap-3 pt-3"
                    style={{ borderTop: "1px solid var(--border-card)" }}
                  >
                    <button
                      onClick={() => openEditForm(session)}
                      className="flex items-center gap-1 text-[11px] font-medium"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="flex items-center gap-1 text-[11px] font-medium"
                      style={{ color: "#FF6B6B" }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty */}
        {!loading && sessions.length === 0 && (
          <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            No theory sessions found
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div
            className="glass-card mx-4 w-full max-w-lg overflow-y-auto p-6"
            style={{ borderRadius: "20px", maxHeight: "85vh" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-[18px] font-semibold" style={{ color: "var(--text-primary)" }}>
                {editingSession ? "Edit Theory Session" : "Add Theory Session"}
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
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Understanding Anxiety"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Brief description of the session..."
                  required
                />
              </div>

              {/* Modules */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                    Modules ({modules.length})
                  </label>
                  <button
                    type="button"
                    onClick={addModule}
                    className="flex items-center gap-1 text-[11px] font-medium"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    <Plus size={12} /> Add Module
                  </button>
                </div>

                <div className="space-y-3">
                  {modules.map((mod, index) => (
                    <div
                      key={index}
                      className="rounded-[14px] p-3"
                      style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical size={12} style={{ color: "var(--text-muted)" }} />
                          <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                            Module {index + 1}
                          </span>
                        </div>
                        {modules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeModule(index)}
                            className="flex items-center gap-1 text-[10px]"
                            style={{ color: "#FF6B6B" }}
                          >
                            <X size={12} /> Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={mod.title}
                        onChange={(e) => updateModule(index, "title", e.target.value)}
                        className="input-field mb-2"
                        placeholder="Module title"
                      />
                      <textarea
                        value={mod.content}
                        onChange={(e) => updateModule(index, "content", e.target.value)}
                        className="input-field"
                        rows={2}
                        placeholder="Module content..."
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Duration (min)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="input-field"
                    min={1}
                    placeholder="30"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
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
                  {saving ? "Saving..." : editingSession ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
