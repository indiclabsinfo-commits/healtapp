"use client";

import { useState, useEffect, useRef } from "react";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import { bulkRegisterApi, bulkHistoryApi, downloadTemplateApi } from "@/lib/users";
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
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History
  const [history, setHistory] = useState<BulkUpload[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setHistoryLoading(true);
    try {
      const result = await bulkHistoryApi({ limit: 20 });
      setHistory(result.data);
    } catch {
      // Silently fail for history
    } finally {
      setHistoryLoading(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setFile(droppedFile);
      setUploadResult(null);
      setError("");
    } else {
      setError("Only CSV files are accepted");
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setUploadResult(null);
      setError("");
    }
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");
    setUploadResult(null);

    try {
      const result = await bulkRegisterApi(file);
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
      a.download = "bulk-register-template.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download template");
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "completed": return <CheckCircle size={14} style={{ color: "#4ADE80" }} />;
      case "partial": return <AlertCircle size={14} style={{ color: "#FFD93D" }} />;
      case "failed": return <XCircle size={14} style={{ color: "#FF6B6B" }} />;
      default: return null;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "completed": return { bg: "rgba(74,222,128,0.1)", color: "#4ADE80", border: "rgba(74,222,128,0.15)" };
      case "partial": return { bg: "rgba(255,217,61,0.1)", color: "#FFD93D", border: "rgba(255,217,61,0.15)" };
      case "failed": return { bg: "rgba(255,107,107,0.1)", color: "#FF6B6B", border: "rgba(255,107,107,0.15)" };
      default: return { bg: "rgba(111,255,233,0.1)", color: "var(--accent-primary)", border: "rgba(111,255,233,0.15)" };
    }
  }

  return (
    <div>
      <AdminTopbar title="Bulk Register" subtitle="Register multiple users via CSV upload" />

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
            or click to browse · Accepted: .csv
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          {file && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <FileText size={14} style={{ color: "var(--accent-primary)" }} />
              <span className="text-[12px] font-medium" style={{ color: "var(--accent-primary)" }}>
                {file.name}
              </span>
            </div>
          )}
        </div>

        {/* Required columns + template */}
        <div className="glass-card mb-6 p-4">
          <p className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
            Required columns:
          </p>
          <div className="mt-2 flex gap-2">
            <span className="tag">name</span>
            <span className="tag">email</span>
            <span className="tag" style={{ opacity: 0.5 }}>phone (optional)</span>
          </div>
          <p className="mt-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
            Default password for all users: User@123
          </p>
          <button
            onClick={handleDownloadTemplate}
            className="mt-3 flex items-center gap-1 text-[11px] font-medium"
            style={{ color: "var(--accent-primary)" }}
          >
            <Download size={12} /> Download Template
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-card p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
            {error}
          </div>
        )}

        {/* Upload button */}
        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="cta-button mb-6"
          >
            {uploading ? "Uploading..." : `Upload ${file.name}`}
          </button>
        )}

        {/* Upload result */}
        {uploadResult && (
          <div className="glass-card mb-8 p-5" style={{ borderRadius: "16px" }}>
            <p className="text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>
              Upload Complete
            </p>
            <div className="mt-3 grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Total</p>
                <p className="mt-1 text-[20px] font-bold" style={{ color: "var(--text-primary)" }}>{uploadResult.totalRows}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Success</p>
                <p className="mt-1 text-[20px] font-bold" style={{ color: "#4ADE80" }}>{uploadResult.successCount}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Errors</p>
                <p className="mt-1 text-[20px] font-bold" style={{ color: "#FF6B6B" }}>{uploadResult.errorCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload History */}
        <h2 className="mb-4 font-heading text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Upload History
        </h2>

        {/* Table Header */}
        <div
          className="mb-2 grid grid-cols-[1fr_120px_80px_80px_80px_100px] gap-4 px-5 py-3 text-[10px] uppercase tracking-[1.5px]"
          style={{ color: "var(--text-muted)" }}
        >
          <div>Filename</div>
          <div>Date</div>
          <div>Total</div>
          <div>Success</div>
          <div>Errors</div>
          <div>Status</div>
        </div>

        {historyLoading && (
          <div className="py-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            Loading history...
          </div>
        )}

        {!historyLoading && history.map((h) => {
          const sc = getStatusColor(h.status);
          return (
            <div
              key={h.id}
              className="glass-card mb-2 grid grid-cols-[1fr_120px_80px_80px_80px_100px] items-center gap-4 px-5 py-4"
            >
              <span className="truncate text-[12px]" style={{ color: "var(--text-primary)" }}>
                {h.filename}
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {formatDate(h.createdAt)}
              </span>
              <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                {h.totalRows}
              </span>
              <span className="text-[13px] font-medium" style={{ color: "#4ADE80" }}>
                {h.successCount}
              </span>
              <span className="text-[13px] font-medium" style={{ color: h.errorCount > 0 ? "#FF6B6B" : "var(--text-muted)" }}>
                {h.errorCount}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide"
                style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
              >
                {getStatusIcon(h.status)}
                {h.status}
              </span>
            </div>
          );
        })}

        {!historyLoading && history.length === 0 && (
          <div className="py-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            No upload history yet
          </div>
        )}
      </div>
    </div>
  );
}
