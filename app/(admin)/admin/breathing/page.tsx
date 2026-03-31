"use client";

import { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { listBreathingApi, createBreathingApi, updateBreathingApi, deleteBreathingApi } from "@/lib/breathing";
import { Plus, Pencil, Trash2, X, Wind, Timer } from "lucide-react";

interface BreathingExercise {
  id: number;
  name: string;
  description: string;
  inhaleSeconds: number;
  holdSeconds: number;
  exhaleSeconds: number;
  holdAfterExhale: number;
  defaultCycles: number;
  category: string;
  status: string;
}

const CATEGORIES = ["relaxation", "balance", "calm", "sleep", "anxiety"];

const CATEGORY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  relaxation: { bg: "rgba(111,255,233,0.1)", color: "#6FFFE9", border: "rgba(111,255,233,0.15)" },
  balance: { bg: "rgba(91,192,190,0.1)", color: "#5BC0BE", border: "rgba(91,192,190,0.15)" },
  calm: { bg: "rgba(167,139,250,0.1)", color: "#A78BFA", border: "rgba(167,139,250,0.15)" },
  sleep: { bg: "rgba(96,165,250,0.1)", color: "#60A5FA", border: "rgba(96,165,250,0.15)" },
  anxiety: { bg: "rgba(255,217,61,0.1)", color: "#FFD93D", border: "rgba(255,217,61,0.15)" },
};

export default function AdminBreathingPage() {
  const [exercises, setExercises] = useState<BreathingExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Form modal
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<BreathingExercise | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    inhaleSeconds: "",
    holdSeconds: "",
    exhaleSeconds: "",
    holdAfterExhale: "",
    defaultCycles: "",
    category: "relaxation",
    status: "INACTIVE",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchExercises();
  }, [categoryFilter]);

  async function fetchExercises() {
    setLoading(true);
    setError("");
    try {
      const result = await listBreathingApi({
        limit: 50,
        category: categoryFilter || undefined,
      });
      setExercises(result.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch breathing exercises");
    } finally {
      setLoading(false);
    }
  }

  function openAddForm() {
    setEditingExercise(null);
    setFormData({
      name: "",
      description: "",
      inhaleSeconds: "4",
      holdSeconds: "4",
      exhaleSeconds: "4",
      holdAfterExhale: "4",
      defaultCycles: "4",
      category: "relaxation",
      status: "ACTIVE",
    });
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(ex: BreathingExercise) {
    setEditingExercise(ex);
    // Normalize status: treat any non-ACTIVE value as INACTIVE
    const normalizedStatus = ex.status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
    setFormData({
      name: ex.name,
      description: ex.description,
      inhaleSeconds: String(ex.inhaleSeconds),
      holdSeconds: String(ex.holdSeconds),
      exhaleSeconds: String(ex.exhaleSeconds),
      holdAfterExhale: String(ex.holdAfterExhale),
      defaultCycles: String(ex.defaultCycles),
      category: ex.category,
      status: normalizedStatus,
    });
    setFormError("");
    setShowForm(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        inhaleSeconds: parseInt(formData.inhaleSeconds) || 0,
        holdSeconds: parseInt(formData.holdSeconds) || 0,
        exhaleSeconds: parseInt(formData.exhaleSeconds) || 0,
        holdAfterExhale: parseInt(formData.holdAfterExhale) || 0,
        defaultCycles: parseInt(formData.defaultCycles) || 4,
        category: formData.category,
        status: formData.status,
      };

      if (editingExercise) {
        await updateBreathingApi(editingExercise.id, payload);
      } else {
        await createBreathingApi(payload);
      }

      setShowForm(false);
      fetchExercises();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to save breathing exercise");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this breathing exercise?")) return;
    try {
      await deleteBreathingApi(id);
      fetchExercises();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete breathing exercise");
    }
  }

  function formatTiming(ex: BreathingExercise) {
    const parts = [`${ex.inhaleSeconds}s in`];
    if (ex.holdSeconds > 0) parts.push(`${ex.holdSeconds}s hold`);
    parts.push(`${ex.exhaleSeconds}s out`);
    if (ex.holdAfterExhale > 0) parts.push(`${ex.holdAfterExhale}s hold`);
    return parts.join(" \u00B7 ");
  }

  function getTotalCycleTime(ex: BreathingExercise) {
    return ex.inhaleSeconds + ex.holdSeconds + ex.exhaleSeconds + ex.holdAfterExhale;
  }

  function getCategoryStyle(category: string) {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.relaxation;
  }

  return (
    <div>
      <AdminTopbar title="Breathing Exercises" subtitle="Manage guided breathing patterns" />

      <div className="p-8">
        {/* Header + Add button */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {exercises.length} exercise{exercises.length !== 1 ? "s" : ""} total
          </p>
          <button
            onClick={openAddForm}
            className="cta-button flex items-center gap-2"
            style={{ width: "auto", padding: "10px 20px" }}
          >
            <Plus size={16} />
            Add Exercise
          </button>
        </div>

        {/* Category filter pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter("")}
            className={categoryFilter === "" ? "pill-active" : "pill-inactive"}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? "" : cat)}
              className={categoryFilter === cat ? "pill-active" : "pill-inactive"}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
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
            Loading breathing exercises...
          </div>
        )}

        {/* Card Grid */}
        {!loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exercises.map((ex) => {
              const catStyle = getCategoryStyle(ex.category);
              const cycleTime = getTotalCycleTime(ex);

              return (
                <div key={ex.id} className="glass-card p-5" style={{ borderRadius: "20px" }}>
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px]"
                      style={{ background: catStyle.bg, color: catStyle.color }}
                    >
                      <Wind size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {ex.name}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {ex.description}
                      </p>
                    </div>
                  </div>

                  {/* Breathing Pattern Visual */}
                  <div
                    className="mt-3 rounded-[12px] p-3"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
                  >
                    <div className="mb-2 flex items-center gap-1">
                      <Timer size={10} style={{ color: "var(--text-muted)" }} />
                      <span className="text-[9px] uppercase tracking-[1px]" style={{ color: "var(--text-muted)" }}>
                        Breathing Pattern
                      </span>
                    </div>
                    {/* Phase bars */}
                    <div className="flex items-end gap-1" style={{ height: "32px" }}>
                      {/* Inhale */}
                      <div className="flex flex-1 flex-col items-center gap-0.5">
                        <div
                          className="w-full rounded-[4px]"
                          style={{
                            height: `${Math.max(8, (ex.inhaleSeconds / cycleTime) * 32)}px`,
                            background: "linear-gradient(135deg, #6FFFE9, #5BC0BE)",
                            opacity: 0.8,
                          }}
                        />
                        <span className="text-[8px]" style={{ color: "var(--text-muted)" }}>{ex.inhaleSeconds}s</span>
                      </div>
                      {/* Hold */}
                      {ex.holdSeconds > 0 && (
                        <div className="flex flex-1 flex-col items-center gap-0.5">
                          <div
                            className="w-full rounded-[4px]"
                            style={{
                              height: `${Math.max(8, (ex.holdSeconds / cycleTime) * 32)}px`,
                              background: "#A78BFA",
                              opacity: 0.6,
                            }}
                          />
                          <span className="text-[8px]" style={{ color: "var(--text-muted)" }}>{ex.holdSeconds}s</span>
                        </div>
                      )}
                      {/* Exhale */}
                      <div className="flex flex-1 flex-col items-center gap-0.5">
                        <div
                          className="w-full rounded-[4px]"
                          style={{
                            height: `${Math.max(8, (ex.exhaleSeconds / cycleTime) * 32)}px`,
                            background: "linear-gradient(135deg, #5BC0BE, #6FFFE9)",
                            opacity: 0.5,
                          }}
                        />
                        <span className="text-[8px]" style={{ color: "var(--text-muted)" }}>{ex.exhaleSeconds}s</span>
                      </div>
                      {/* Hold after exhale */}
                      {ex.holdAfterExhale > 0 && (
                        <div className="flex flex-1 flex-col items-center gap-0.5">
                          <div
                            className="w-full rounded-[4px]"
                            style={{
                              height: `${Math.max(8, (ex.holdAfterExhale / cycleTime) * 32)}px`,
                              background: "#A78BFA",
                              opacity: 0.4,
                            }}
                          />
                          <span className="text-[8px]" style={{ color: "var(--text-muted)" }}>{ex.holdAfterExhale}s</span>
                        </div>
                      )}
                    </div>
                    {/* Phase labels */}
                    <div className="mt-1 flex gap-1">
                      <span className="flex-1 text-center text-[7px] uppercase" style={{ color: "var(--accent-primary)" }}>In</span>
                      {ex.holdSeconds > 0 && (
                        <span className="flex-1 text-center text-[7px] uppercase" style={{ color: "#A78BFA" }}>Hold</span>
                      )}
                      <span className="flex-1 text-center text-[7px] uppercase" style={{ color: "var(--accent-primary)" }}>Out</span>
                      {ex.holdAfterExhale > 0 && (
                        <span className="flex-1 text-center text-[7px] uppercase" style={{ color: "#A78BFA" }}>Hold</span>
                      )}
                    </div>
                  </div>

                  {/* Timing + Cycles */}
                  <p className="mt-2 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    {formatTiming(ex)} · {ex.defaultCycles} cycles
                  </p>

                  {/* Tags row */}
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className="tag"
                      style={{
                        background: catStyle.bg,
                        color: catStyle.color,
                        borderColor: catStyle.border,
                      }}
                    >
                      {ex.category}
                    </span>
                    <span
                      className="inline-block rounded-pill px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide"
                      style={{
                        background: ex.status === "ACTIVE" ? "rgba(74,222,128,0.1)" : "rgba(255,217,61,0.1)",
                        color: ex.status === "ACTIVE" ? "#4ADE80" : "#FFD93D",
                        border: `1px solid ${ex.status === "ACTIVE" ? "rgba(74,222,128,0.15)" : "rgba(255,217,61,0.15)"}`,
                      }}
                    >
                      {ex.status === "ACTIVE" ? "Published" : "Draft"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div
                    className="mt-4 flex gap-3 pt-3"
                    style={{ borderTop: "1px solid var(--border-card)" }}
                  >
                    <button
                      onClick={() => openEditForm(ex)}
                      className="flex items-center gap-1 text-[11px] font-medium"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ex.id)}
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
        {!loading && exercises.length === 0 && (
          <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            No breathing exercises found
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
                {editingExercise ? "Edit Exercise" : "Add Exercise"}
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
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Box Breathing"
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
                  placeholder="Describe the exercise and its benefits..."
                  required
                />
              </div>

              {/* Timing inputs */}
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  Breathing Timing (seconds)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px]" style={{ color: "var(--text-secondary)" }}>Inhale</label>
                    <input
                      type="number"
                      value={formData.inhaleSeconds}
                      onChange={(e) => setFormData({ ...formData, inhaleSeconds: e.target.value })}
                      className="input-field"
                      min={1}
                      max={30}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px]" style={{ color: "var(--text-secondary)" }}>Hold</label>
                    <input
                      type="number"
                      value={formData.holdSeconds}
                      onChange={(e) => setFormData({ ...formData, holdSeconds: e.target.value })}
                      className="input-field"
                      min={0}
                      max={30}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px]" style={{ color: "var(--text-secondary)" }}>Exhale</label>
                    <input
                      type="number"
                      value={formData.exhaleSeconds}
                      onChange={(e) => setFormData({ ...formData, exhaleSeconds: e.target.value })}
                      className="input-field"
                      min={1}
                      max={30}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px]" style={{ color: "var(--text-secondary)" }}>Hold After Exhale</label>
                    <input
                      type="number"
                      value={formData.holdAfterExhale}
                      onChange={(e) => setFormData({ ...formData, holdAfterExhale: e.target.value })}
                      className="input-field"
                      min={0}
                      max={30}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Cycles</label>
                  <input
                    type="number"
                    value={formData.defaultCycles}
                    onChange={(e) => setFormData({ ...formData, defaultCycles: e.target.value })}
                    className="input-field"
                    min={1}
                    max={50}
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="INACTIVE">Draft</option>
                    <option value="ACTIVE">Published</option>
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
                  {saving ? "Saving..." : editingExercise ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
