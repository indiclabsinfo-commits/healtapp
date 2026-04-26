"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { listCounsellorsApi, createCounsellorApi, updateCounsellorApi, deleteCounsellorApi, linkCounsellorUserApi } from "@/lib/counsellors";
import { Search, Plus, Pencil, Trash2, X, Star, Link2, Calendar } from "lucide-react";

interface CounsellorTag {
  id: number;
  name: string;
}

interface Counsellor {
  id: number;
  name: string;
  specialization: string;
  qualifications: string;
  experience: number;
  bio: string;
  rating: number;
  photo: string | null;
  status: string;
  userId: number | null;
  tags: CounsellorTag[];
}

const COMMON_TAGS = ["Anxiety", "Depression", "CBT", "Trauma", "Stress", "Relationships", "Self-esteem", "OCD", "Mindfulness"];

export default function AdminCounsellorsPage() {
  const router = useRouter();
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  // Form modal
  const [showForm, setShowForm] = useState(false);
  const [editingCounsellor, setEditingCounsellor] = useState<Counsellor | null>(null);
  const [formData, setFormData] = useState({
    name: "", specialization: "", qualifications: "", experience: "", bio: "", tags: "", email: "", hourlyRate: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link user modal
  const [linkTarget, setLinkTarget] = useState<Counsellor | null>(null);
  const [linkEmail, setLinkEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkMsg, setLinkMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Debounce search
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetchCounsellors();
  }, [tagFilter]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchCounsellors(), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  async function fetchCounsellors() {
    setLoading(true);
    setError("");
    try {
      const result = await listCounsellorsApi({
        limit: 50,
        search: search || undefined,
        tag: tagFilter || undefined,
      });
      setCounsellors(result.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch counsellors");
    } finally {
      setLoading(false);
    }
  }

  function openAddForm() {
    setEditingCounsellor(null);
    setFormData({ name: "", specialization: "", qualifications: "", experience: "", bio: "", tags: "", email: "", hourlyRate: "" });
    setPhotoFile(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(c: Counsellor) {
    setEditingCounsellor(c);
    setFormData({
      name: c.name,
      specialization: c.specialization,
      qualifications: c.qualifications,
      experience: String(c.experience),
      bio: c.bio,
      tags: c.tags.map((t) => t.name).join(", "),
      email: "",
      hourlyRate: (c as any).hourlyRate != null ? String((c as any).hourlyRate) : "",
    });
    setPhotoFile(null);
    setFormError("");
    setShowForm(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("specialization", formData.specialization);
      fd.append("qualifications", formData.qualifications);
      fd.append("experience", formData.experience);
      fd.append("bio", formData.bio);
      if (formData.hourlyRate) fd.append("hourlyRate", formData.hourlyRate);
      if (formData.email && !editingCounsellor) fd.append("email", formData.email);

      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      fd.append("tags", JSON.stringify(tagsArray));

      if (photoFile) {
        fd.append("photo", photoFile);
      }

      if (editingCounsellor) {
        await updateCounsellorApi(editingCounsellor.id, fd);
      } else {
        await createCounsellorApi(fd);
      }

      setShowForm(false);
      fetchCounsellors();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to save counsellor");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteCounsellorApi(id);
      setConfirmDeleteId(null);
      fetchCounsellors();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to deactivate counsellor");
      setConfirmDeleteId(null);
    }
  }

  async function handleLinkUser(e: React.FormEvent) {
    e.preventDefault();
    if (!linkTarget || !linkEmail.trim()) return;
    setLinking(true);
    setLinkMsg(null);
    try {
      await linkCounsellorUserApi(linkTarget.id, linkEmail.trim());
      setLinkMsg({ type: "success", text: `Linked to ${linkEmail}` });
      fetchCounsellors();
    } catch (err: any) {
      setLinkMsg({ type: "error", text: err.response?.data?.error || "Failed to link account" });
    } finally {
      setLinking(false);
    }
  }

  // Collect unique tags from counsellors for filter pills
  const allTags = Array.from(new Set(counsellors.flatMap((c) => c.tags.map((t) => t.name))));

  return (
    <div>
      <AdminTopbar title="Counsellors" subtitle="Manage counsellors and their profiles" />

      <div className="p-8">
        {/* Search + Filter + Add */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div
            className="flex flex-1 items-center gap-2 rounded-input px-4 py-3"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", maxWidth: "400px" }}
          >
            <Search size={14} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-[13px] outline-none"
              style={{ color: "var(--text-primary)" }}
            />
          </div>

          <button
            onClick={openAddForm}
            className="cta-button flex items-center gap-2"
            style={{ width: "auto", padding: "10px 20px" }}
          >
            <Plus size={16} />
            Add Counsellor
          </button>
        </div>

        {/* Tag filter pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setTagFilter("")}
            className={tagFilter === "" ? "pill-active" : "pill-inactive"}
          >
            All
          </button>
          {(allTags.length > 0 ? allTags : COMMON_TAGS).map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}
              className={tagFilter === tag ? "pill-active" : "pill-inactive"}
            >
              {tag}
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
            Loading counsellors...
          </div>
        )}

        {/* Card Grid */}
        {!loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {counsellors.map((c) => (
              <div key={c.id} className="glass-card p-5" style={{ borderRadius: "20px" }}>
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px] text-lg font-bold"
                    style={{ background: "rgba(111,255,233,0.1)", color: "var(--accent-primary)" }}
                  >
                    {c.photo ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "")}${c.photo}`}
                        alt={c.name}
                        className="h-12 w-12 rounded-[14px] object-cover"
                      />
                    ) : (
                      c.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      {c.name}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {c.specialization} · {c.experience} yrs
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      <Star size={11} fill="#FFD93D" stroke="#FFD93D" />
                      <span className="text-[11px]" style={{ color: "#FFD93D" }}>{c.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {c.tags.map((t) => (
                    <span key={t.id} className="tag">{t.name}</span>
                  ))}
                </div>

                {/* Actions */}
                <div
                  className="mt-4 flex flex-wrap gap-x-3 gap-y-2 pt-3"
                  style={{ borderTop: "1px solid var(--border-card)" }}
                >
                  <button
                    onClick={() => openEditForm(c)}
                    className="flex items-center gap-1 text-[11px] font-medium"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => { setLinkTarget(c); setLinkEmail(""); setLinkMsg(null); }}
                    className="flex items-center gap-1 text-[11px] font-medium"
                    style={{ color: c.userId ? "#4ADE80" : "#FFD93D" }}
                    title={c.userId ? "Linked to user account" : "Link to user account"}
                  >
                    <Link2 size={12} /> {c.userId ? "Linked" : "Link User"}
                  </button>
                  <button
                    onClick={() => router.push(`/admin/schedule?id=${c.id}`)}
                    className="flex items-center gap-1 text-[11px] font-medium"
                    style={{ color: "#A78BFA" }}
                  >
                    <Calendar size={12} /> Schedule
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(c.id)}
                    className="flex items-center gap-1 text-[11px] font-medium"
                    style={{ color: "#FF6B6B" }}
                  >
                    <Trash2 size={12} /> Deactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && counsellors.length === 0 && (
          <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            No counsellors found
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
                {editingCounsellor ? "Edit Counsellor" : "Add Counsellor"}
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
                <label htmlFor="counsellor-name" className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Name</label>
                <input id="counsellor-name" name="name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" required />
              </div>

              <div>
                <label htmlFor="counsellor-specialization" className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Specialization</label>
                <input id="counsellor-specialization" name="specialization" type="text" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} className="input-field" required />
              </div>

              <div>
                <label htmlFor="counsellor-qualifications" className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Qualifications</label>
                <textarea id="counsellor-qualifications" name="qualifications" value={formData.qualifications} onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })} className="input-field" rows={3} required />
              </div>

              <div>
                <label htmlFor="counsellor-experience" className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Experience (years)</label>
                <input id="counsellor-experience" name="experience" type="number" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} className="input-field" min={0} required />
              </div>

              <div>
                <label htmlFor="counsellor-bio" className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Bio</label>
                <textarea id="counsellor-bio" name="bio" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="input-field" rows={3} required />
              </div>

              <div>
                <label htmlFor="counsellor-tags" className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Tags (comma-separated)</label>
                <input id="counsellor-tags" name="tags" type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="input-field" placeholder="Anxiety, CBT, Trauma" />
              </div>

              <div>
                <label htmlFor="counsellor-hourly-rate" className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Hourly Rate (₹)</label>
                <input id="counsellor-hourly-rate" name="hourlyRate" type="number" value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })} className="input-field" min={0} step="0.01" placeholder="e.g. 1500" />
              </div>

              {!editingCounsellor && (
                <div>
                  <label htmlFor="counsellor-email" className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Email (auto-links user account)</label>
                  <input id="counsellor-email" name="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="counsellor@school.edu" />
                </div>
              )}

              <div>
                <label htmlFor="counsellor-photo" className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Photo</label>
                <input
                  id="counsellor-photo"
                  name="photo"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="text-[12px]"
                  style={{ color: "var(--text-secondary)" }}
                />
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
                  {saving ? "Saving..." : editingCounsellor ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link User Modal */}
      {linkTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="glass-card w-full max-w-md p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-[17px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Link Account — {linkTarget.name}
              </h3>
              <button onClick={() => setLinkTarget(null)} style={{ color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-[12px]" style={{ color: "var(--text-muted)" }}>
              Enter the email of the user account this counsellor logs in with. This enables their counsellor dashboard to show sessions.
            </p>
            <form onSubmit={handleLinkUser} className="space-y-3">
              <input
                type="email"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                placeholder="counsellor@school.edu"
                required
                className="w-full rounded-[12px] px-4 py-3 text-[13px] outline-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
              />
              {linkMsg && (
                <p className="rounded-[8px] px-3 py-2 text-[12px]" style={{
                  background: linkMsg.type === "success" ? "rgba(74,222,128,0.1)" : "rgba(255,107,107,0.1)",
                  color: linkMsg.type === "success" ? "#4ADE80" : "#FF6B6B",
                }}>{linkMsg.text}</p>
              )}
              <div className="flex gap-2">
                <button type="submit" disabled={linking}
                  className="flex-1 rounded-[12px] py-3 text-[13px] font-semibold disabled:opacity-50"
                  style={{ background: "var(--gradient-cta)", color: "#0B0C10" }}>
                  {linking ? "Linking…" : "Link Account"}
                </button>
                <button type="button" onClick={() => setLinkTarget(null)}
                  className="rounded-[12px] px-5 py-3 text-[13px]"
                  style={{ background: "var(--input-bg)", color: "var(--text-muted)" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate confirm modal */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="glass-card mx-4 w-full max-w-sm p-6" style={{ borderRadius: "20px" }}>
            <h3 className="font-heading mb-2 text-[17px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Deactivate Counsellor?
            </h3>
            <p className="mb-6 text-[13px]" style={{ color: "var(--text-secondary)" }}>
              This counsellor will be hidden from students and unable to receive new bookings.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 rounded-[12px] py-3 text-[13px] font-semibold"
                style={{ background: "rgba(255,107,107,0.15)", color: "#FF6B6B" }}
              >
                Deactivate
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-[12px] py-3 text-[13px]"
                style={{ background: "var(--input-bg)", color: "var(--text-muted)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
