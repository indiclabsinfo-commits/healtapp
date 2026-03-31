"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { forgotPasswordApi } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await forgotPasswordApi(email);
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Back */}
      <Link
        href="/login"
        className="mb-8 inline-flex items-center gap-2 text-[12px]"
        style={{ color: "var(--text-muted)" }}
      >
        <ArrowLeft size={16} />
        Back to login
      </Link>

      {/* Header */}
      <h1 className="font-heading text-[28px] font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
        Forgot{" "}
        <br />
        Password<span style={{ color: "var(--accent-primary)" }}>?</span>
      </h1>
      <p className="mt-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
        Enter your email and we&apos;ll send you a reset link
      </p>

      {sent ? (
        <div className="mt-8 rounded-card p-6 text-center" style={{ background: "rgba(74,222,128,0.08)" }}>
          <p className="text-[14px] font-medium" style={{ color: "var(--accent-primary)" }}>
            Check your email
          </p>
          <p className="mt-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
            If an account exists with that email, we&apos;ve sent a password reset link.
          </p>
        </div>
      ) : (
        <>
          {/* Error */}
          {error && (
            <div className="mt-4 rounded-card p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                className="mb-2 block text-[10px] font-normal uppercase tracking-[1.5px]"
                style={{ color: "var(--text-muted)" }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                className="input-field"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="cta-button">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
