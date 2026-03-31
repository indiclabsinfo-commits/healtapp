"use client";

import { useState, useEffect, useRef } from "react";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { listUsersApi, updateUserApi, toggleUserStatusApi } from "@/lib/users";
import { Search, Pencil, ToggleLeft, ToggleRight, X, ChevronLeft, ChevronRight } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });

  // Edit modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "USER", status: "ACTIVE" });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Debounce search
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  async function fetchUsers() {
    setLoading(true);
    setError("");
    try {
      const result = await listUsersApi({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setUsers(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role, status: user.status });
    setEditError("");
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    setEditError("");
    try {
      await updateUserApi(editingUser.id, editForm);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setEditError(err.response?.data?.error || "Failed to update user");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(user: User) {
    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await toggleUserStatusApi(user.id, newStatus);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to toggle status");
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div>
      <AdminTopbar title="Users" subtitle="Manage registered users" />

      <div className="p-8">
        {/* Search + Filter */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div
            className="flex flex-1 items-center gap-2 rounded-input px-4 py-3"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", maxWidth: "400px" }}
          >
            <Search size={14} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-[13px] outline-none"
              style={{ color: "var(--text-primary)" }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-input px-4 py-3 text-[12px]"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-card p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
            {error}
          </div>
        )}

        {/* Table Header */}
        <div
          className="mb-2 grid grid-cols-[60px_1fr_1fr_100px_100px_80px] gap-4 px-5 py-3 text-[10px] uppercase tracking-[1.5px]"
          style={{ color: "var(--text-muted)" }}
        >
          <div>ID</div>
          <div>Name</div>
          <div>Email</div>
          <div>Joined</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            Loading users...
          </div>
        )}

        {/* Rows */}
        {!loading && users.map((user) => (
          <div
            key={user.id}
            className="glass-card mb-2 grid grid-cols-[60px_1fr_1fr_100px_100px_80px] items-center gap-4 px-5 py-4"
          >
            <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              {user.id}
            </span>
            <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
              {user.name}
            </span>
            <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
              {user.email}
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {formatDate(user.createdAt)}
            </span>
            <span>
              <span
                className="inline-block rounded-pill px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide"
                style={{
                  background: user.status === "ACTIVE" ? "rgba(111,255,233,0.1)" : "rgba(255,107,107,0.1)",
                  color: user.status === "ACTIVE" ? "var(--accent-primary)" : "#FF6B6B",
                  border: `1px solid ${user.status === "ACTIVE" ? "rgba(111,255,233,0.15)" : "rgba(255,107,107,0.15)"}`,
                }}
              >
                {user.status}
              </span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(user)}
                className="rounded-icon p-1.5"
                style={{ color: "var(--accent-primary)" }}
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleToggleStatus(user)}
                className="rounded-icon p-1.5"
                style={{ color: user.status === "ACTIVE" ? "#FF6B6B" : "#4ADE80" }}
                title={user.status === "ACTIVE" ? "Deactivate" : "Activate"}
              >
                {user.status === "ACTIVE" ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              </button>
            </div>
          </div>
        ))}

        {/* Empty */}
        {!loading && users.length === 0 && (
          <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            No users found
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, pagination.total)} of {pagination.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-icon p-2"
                style={{ color: page === 1 ? "var(--text-disabled)" : "var(--text-primary)" }}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className="flex h-8 w-8 items-center justify-center rounded-icon text-[12px] font-medium"
                    style={{
                      background: page === pageNum ? "var(--gradient-cta)" : "transparent",
                      color: page === pageNum ? "var(--cta-text)" : "var(--text-muted)",
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="rounded-icon p-2"
                style={{ color: page === pagination.totalPages ? "var(--text-disabled)" : "var(--text-primary)" }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="glass-card mx-4 w-full max-w-md p-6" style={{ borderRadius: "20px" }}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-[18px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Edit User
              </h2>
              <button onClick={() => setEditingUser(null)} style={{ color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="mb-4 rounded-card p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                    Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="input-field"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 rounded-button border px-4 py-3 text-[13px] font-medium"
                  style={{ borderColor: "var(--accent-primary)", color: "var(--accent-primary)", background: "transparent" }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="cta-button flex-1">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
