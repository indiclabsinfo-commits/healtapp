"use client";

import { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { listOrganizationsApi, createOrganizationApi, updateOrganizationApi } from "@/lib/organizations";
import api from "@/lib/api";
import { Plus, Pencil, Trash2, X, Building2, Users, CreditCard, Hash } from "lucide-react";

interface Organization {
  id: number;
  name: string;
  type: string;
  code: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  creditBalance: number;
  status: string;
  _count?: { members: number };
  createdAt: string;
}

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  SCHOOL: { bg: "rgba(111,255,233,0.1)", color: "#6FFFE9", border: "rgba(111,255,233,0.15)" },
  CORPORATE: { bg: "rgba(167,139,250,0.1)", color: "#A78BFA", border: "rgba(167,139,250,0.15)" },
};

function generateOrgCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "ORG-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form modal
  const [showForm, setShowForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "SCHOOL",
    code: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    creditBalance: "0",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchOrganizations();
  }, []);

  async function fetchOrganizations() {
    setLoading(true);
    setError("");
    try {
      const result = await listOrganizationsApi({ limit: 50 });
      setOrganizations(result.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  }

  function openAddForm() {
    setEditingOrg(null);
    setFormData({
      name: "",
      type: "SCHOOL",
      code: generateOrgCode(),
      contactEmail: "",
      contactPhone: "",
      address: "",
      creditBalance: "100",
    });
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(org: Organization) {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      type: org.type,
      code: org.code,
      contactEmail: org.contactEmail || "",
      contactPhone: org.contactPhone || "",
      address: org.address || "",
      creditBalance: String(org.creditBalance),
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
        name: formData.name,
        type: formData.type,
        code: formData.code,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        address: formData.address || undefined,
        creditBalance: parseInt(formData.creditBalance) || 0,
      };

      if (editingOrg) {
        await updateOrganizationApi(editingOrg.id, payload);
      } else {
        await createOrganizationApi(payload);
      }

      setShowForm(false);
      fetchOrganizations();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to save organization");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to deactivate this organization?")) return;
    try {
      await api.delete(`/organizations/${id}`);
      fetchOrganizations();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete organization");
    }
  }

  function getTypeStyle(type: string) {
    return TYPE_COLORS[type] || TYPE_COLORS.SCHOOL;
  }

  return (
    <div>
      <AdminTopbar title="Organizations" subtitle="Manage organizations and their settings" />

      <div className="p-8">
        {/* Header + Add button */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {organizations.length} organization{organizations.length !== 1 ? "s" : ""} total
          </p>
          <button
            onClick={openAddForm}
            className="cta-button flex items-center gap-2"
            style={{ width: "auto", padding: "10px 20px" }}
          >
            <Plus size={16} />
            Add Organization
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
            Loading organizations...
          </div>
        )}

        {/* Card Grid */}
        {!loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => {
              const typeStyle = getTypeStyle(org.type);
              const memberCount = org._count?.members ?? 0;

              return (
                <div key={org.id} className="glass-card p-5" style={{ borderRadius: "20px" }}>
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px]"
                      style={{ background: typeStyle.bg, color: typeStyle.color }}
                    >
                      <Building2 size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {org.name}
                      </p>
                      <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {org.contactEmail || "No email set"}
                      </p>
                    </div>
                  </div>

                  {/* Info rows */}
                  <div
                    className="mt-3 space-y-2 rounded-[12px] p-3"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Hash size={11} style={{ color: "var(--text-muted)" }} />
                        <span className="text-[10px] uppercase tracking-[1px]" style={{ color: "var(--text-muted)" }}>Code</span>
                      </div>
                      <span className="text-[12px] font-medium" style={{ color: "var(--accent-primary)" }}>{org.code}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Users size={11} style={{ color: "var(--text-muted)" }} />
                        <span className="text-[10px] uppercase tracking-[1px]" style={{ color: "var(--text-muted)" }}>Members</span>
                      </div>
                      <span className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{memberCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CreditCard size={11} style={{ color: "var(--text-muted)" }} />
                        <span className="text-[10px] uppercase tracking-[1px]" style={{ color: "var(--text-muted)" }}>Credits</span>
                      </div>
                      <span className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{org.creditBalance}</span>
                    </div>
                  </div>

                  {/* Tags row */}
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className="tag"
                      style={{
                        background: typeStyle.bg,
                        color: typeStyle.color,
                        borderColor: typeStyle.border,
                      }}
                    >
                      {org.type}
                    </span>
                    <span
                      className="inline-block rounded-pill px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide"
                      style={{
                        background: org.status === "ACTIVE" ? "rgba(74,222,128,0.1)" : "rgba(255,217,61,0.1)",
                        color: org.status === "ACTIVE" ? "#4ADE80" : "#FFD93D",
                        border: `1px solid ${org.status === "ACTIVE" ? "rgba(74,222,128,0.15)" : "rgba(255,217,61,0.15)"}`,
                      }}
                    >
                      {org.status === "ACTIVE" ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div
                    className="mt-4 flex gap-3 pt-3"
                    style={{ borderTop: "1px solid var(--border-card)" }}
                  >
                    <button
                      onClick={() => openEditForm(org)}
                      className="flex items-center gap-1 text-[11px] font-medium"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(org.id)}
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
        {!loading && organizations.length === 0 && (
          <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            No organizations found
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
                {editingOrg ? "Edit Organization" : "Add Organization"}
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
                  placeholder="e.g. Springfield Academy"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="SCHOOL">School</option>
                    <option value="CORPORATE">Corporate</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="input-field"
                    placeholder="ORG-XXXXXX"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="input-field"
                  placeholder="admin@school.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Contact Phone</label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="input-field"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder="Organization address..."
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  {editingOrg ? "Credits" : "Initial Credits"}
                </label>
                <input
                  type="number"
                  value={formData.creditBalance}
                  onChange={(e) => setFormData({ ...formData, creditBalance: e.target.value })}
                  className="input-field"
                  min={0}
                  placeholder="100"
                />
                {editingOrg && (
                  <p className="mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                    Current balance: {editingOrg.creditBalance}. Enter a new value to update.
                  </p>
                )}
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
                  {saving ? "Saving..." : editingOrg ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
