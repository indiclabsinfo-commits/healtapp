"use client";

import { useState, useEffect, useRef } from "react";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { useAuthStore } from "@/stores/auth-store";
import { bulkRegisterApi, bulkHistoryApi, downloadTemplateApi } from "@/lib/users";
import { bulkAddMembersApi, getOrgBulkHistoryApi } from "@/lib/organizations";
import { Upload, FileText, Download, CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface BulkUpload {
  id: number;
  filename: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  status: string;
  errors: any;
  createdAt: string;
}

export default function AdminBulkRegisterPage() {
  const { isAdmin, memberships, memberRole } = useAuthStore();
  const isOrgAdmin = !isAdmin && memberRole === "ORG_ADMIN";
  const orgId = memberships[0]?.organization.id ?? 0;

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<BulkUpload[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => { fetchHistory(); }, []);

  async function fetchHistory() {
    setHistoryLoading(true);
    try {
      let result: any;
      if (isOrgAdmin && orgId) {
        result = await getOrgBulkHistoryApi(orgId, { limit: 20 });
        setHistory(result.data || []);
      } else {
        result = await bulkHistoryApi({ limit: 20 });
        setHistory(result.data || []);
      }
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setDragOver(true); }
  function handleDragLeave(e: React.DragEvent) { e.preventDefault(); setDragOver(false); }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) { setFile(f); setUploadResult(null); setError(""); }
    else setError("Only CSV files are accepted");
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setUploadResult(null); setError(""); }
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");
    setUploadResult(null);
    try {
      let result: any;
      if (isOrgAdmin && orgId) {
        result = await bulkAddMembersApi(orgId, file);
      } else {
        result = await bulkRegisterApi(file);
      }
      setUploadResult(result.data);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchHistory();
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownloadTemplate() {
    try {
      const blob = await downloadTemplateApi();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "mindcare-bulk-template.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { setError("Failed to download template"); }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function statusStyle(status: string) {
    switch (status) {
      case "completed": return { bg: "rgba(74,222,128,0.1)", color: "#4ADE80", border: "rgba(74,222,128,0.15)" };
      case "partial":   return { bg: "rgba(255,217,61,0.1)",  color: "#FFD93D", border: "rgba(255,217,61,0.15)" };
      case "failed":    return { bg: "rgba(255,107,107,0.1)", color: "#FF6B6B", border: "rgba(255,107,107,0.15)" };
      default:          return { bg: "rgba(111,255,233,0.1)", color: "var(--accent-primary)", border: "rgba(111,255,233,0.15)" };
    }
  }

  function StatusIcon({ s }: { s: string }) {
    if (s === "completed") return <CheckCircle size={13} style={{ color: "#4ADE80" }} />;
    if (s === "partial")   return <AlertCircle size={13} style={{ color: "#FFD93D" }} />;
    if (s === "failed")    return <XCircle size={13} style={{ color: "#FF6B6B" }} />;
    return null;
  }

  return (
    <div>
      <AdminTopbar
        title="Bulk Register"
        subtitle={isOrgAdmin
          ? `Add students, teachers and counsellors to ${memberships[0]?.organization.name || "your organisation"}`
          : "Register multiple users via CSV upload"}
      />

      <div className="p-8">
        {/* Upload Zone */}
        <div
          className="glass-card mb-6 cursor-pointer p-8 text-center"
          style={{
            border: `2px dashed ${dragOver ? "var(--accent-primary)" : "var(--border-card)"}`,
            borderRadius: "20px",
            background: dragOver ? "rgba(111,255,233,0.03)" : undefined,
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={40} style={{ color: "var(--accent-primary)", margin: "0 auto" }} />
          <p className="mt-4 text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>
            Drop your CSV file here
          </p>
          <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
            or click to browse · Accepted: .csv only
          </p>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
          {file && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <FileText size={14} style={{ color: "var(--accent-primary)" }} />
              <span className="text-[12px] font-medium" style={{ color: "var(--accent-primary)" }}>{file.name}</span>
            </div>
          )}
        </div>

        {/* CSV format info */}
        <div className="glass-card mb-6 p-4">
          <p className="mb-2 text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>CSV Columns</p>
          <div className="flex flex-wrap gap-2">
            <span className="tag">name</span>
            <span className="tag">email</span>
            <span className="tag" style={{ opacity: 0.7 }}>phone</span>
            {isOrgAdmin && (
              <>
                <span className="tag">role</span>
                <span className="tag" style={{ opacity: 0.7 }}>class</span>
                <span className="tag" style={{ opacity: 0.7 }}>section</span>
              </>
            )}
          </div>
          {isOrgAdmin && (
            <div className="mt-3 rounded-[10px] p-3" style={{ background: "var(--input-bg)" }}>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[1px]" style={{ color: "var(--text-muted)" }}>Role values</p>
              <div className="flex flex-wrap gap-1.5">
                {["STUDENT", "TEACHER", "COUNSELLOR", "ORG_ADMIN"].map((r) => (
                  <span key={r} className="rounded-pill px-2 py-0.5 text-[9px] font-mono font-medium" style={{ background: "var(--tag-bg)", color: "var(--accent-primary)" }}>
                    {r}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
                Omit role → defaults to STUDENT. Default password: <span className="font-mono">Welcome@123</span>. Existing users are added to org without overwriting their password.
              </p>
            </div>
          )}
          {!isOrgAdmin && (
            <p className="mt-2 text-[10px]" style={{ color: "var(--text-muted)" }}>Default password: <span className="font-mono">User@123</span></p>
          )}
          <button
            onClick={handleDownloadTemplate}
            className="mt-3 flex items-center gap-1 text-[11px] font-medium"
            style={{ color: "var(--accent-primary)" }}
          >
            <Download size={12} /> Download Template CSV
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-[12px] p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
            {error}
          </div>
        )}

        {file && (
          <button onClick={handleUpload} disabled={uploading} className="cta-button mb-6">
            {uploading ? "Uploading…" : `Upload ${file.name}`}
          </button>
        )}

        {uploadResult && (
          <div className="glass-card mb-8 p-5">
            <p className="mb-3 text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>Upload Complete</p>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Total" value={uploadResult.totalRows} color="var(--text-primary)" />
              <Stat label="Added" value={uploadResult.successCount} color="#4ADE80" />
              <Stat label="Errors" value={uploadResult.errorCount} color={uploadResult.errorCount > 0 ? "#FF6B6B" : "var(--text-muted)"} />
            </div>
            {uploadResult.errors?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[10px] uppercase tracking-[1px]" style={{ color: "var(--text-muted)" }}>Row Errors</p>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {uploadResult.errors.map((e: any, i: number) => (
                    <p key={i} className="text-[11px]" style={{ color: "#FF6B6B" }}>
                      Row {e.row}{e.email ? ` (${e.email})` : ""}: {e.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        <h2 className="mb-4 font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Upload History</h2>

        <div className="mb-2 grid grid-cols-[1fr_130px_70px_70px_70px_110px] gap-4 px-5 py-2 text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
          <div>Filename</div><div>Date</div><div>Total</div><div>Added</div><div>Errors</div><div>Status</div>
        </div>

        {historyLoading && (
          <p className="py-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>Loading…</p>
        )}

        {!historyLoading && history.map((h) => {
          const sc = statusStyle(h.status);
          return (
            <div key={h.id} className="glass-card mb-2 grid grid-cols-[1fr_130px_70px_70px_70px_110px] items-center gap-4 px-5 py-4">
              <span className="truncate text-[12px]" style={{ color: "var(--text-primary)" }}>{h.filename}</span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{formatDate(h.createdAt)}</span>
              <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{h.totalRows}</span>
              <span className="text-[13px] font-medium" style={{ color: "#4ADE80" }}>{h.successCount}</span>
              <span className="text-[13px] font-medium" style={{ color: h.errorCount > 0 ? "#FF6B6B" : "var(--text-muted)" }}>{h.errorCount}</span>
              <span className="inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[9px] font-medium uppercase" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                <StatusIcon s={h.status} />{h.status}
              </span>
            </div>
          );
        })}

        {!historyLoading && history.length === 0 && (
          <p className="py-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>No uploads yet</p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="mt-1 text-[22px] font-bold" style={{ color }}>{value}</p>
    </div>
  );
}
