"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, ChevronRight } from "lucide-react";
import { registerOrgApi } from "@/lib/organizations";

type OrgType = "SCHOOL" | "CORPORATE";

const SCHOOL_SIZES = [
  "Under 300 students",
  "300–600 students",
  "600–1,200 students",
  "1,200–2,500 students",
  "2,500+ students",
];

export default function OrgSignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ orgCode: string; orgName: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    type: "SCHOOL" as OrgType,
    city: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    principalName: "",
    principalEmail: "",
    principalPassword: "",
    size: "",
  });

  function set(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const res = await registerOrgApi({
        name: form.name,
        type: form.type,
        contactEmail: form.contactEmail || form.principalEmail,
        contactPhone: form.contactPhone,
        city: form.city,
        address: form.address,
        principalName: form.principalName,
        principalEmail: form.principalEmail,
        principalPassword: form.principalPassword,
      });
      setDone({ orgCode: res.data.orgCode, orgName: res.data.orgName });
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12" style={{ background: "var(--bg-body)" }}>
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "var(--tag-bg)" }}>
            <CheckCircle2 size={32} style={{ color: "var(--accent-primary)" }} />
          </div>
          <h1 className="font-heading text-[24px] font-semibold" style={{ color: "var(--text-primary)" }}>
            You're registered!
          </h1>
          <p className="mt-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>{done.orgName}</p>

          <div className="glass-card mt-6 p-5 text-left">
            <p className="mb-1 text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Your Org Code</p>
            <p className="font-mono text-[22px] font-bold tracking-widest" style={{ color: "var(--accent-primary)" }}>{done.orgCode}</p>
            <p className="mt-2 text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Share this code with teachers and students so they can join your organisation when signing up.
            </p>
          </div>

          <div className="glass-card mt-3 p-4 text-left">
            <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>Next steps</p>
            <ol className="mt-2 space-y-1.5">
              {[
                "Sign in with your email and password",
                "Go to Bulk Register and upload your student/teacher CSV",
                "Set counsellor availability in the Schedule section",
                "Students can now book sessions",
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[8px] font-bold" style={{ background: "var(--tag-bg)", color: "var(--accent-primary)" }}>
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          <button onClick={() => router.push("/login")} className="cta-button mt-6">
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12" style={{ background: "var(--bg-body)" }}>
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="font-heading text-[26px] font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
            Register your{" "}
            <span style={{ background: "var(--gradient-cta)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {form.type === "SCHOOL" ? "School" : "Organisation"}
            </span>
          </h1>
          <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
            Set up MindCare for your institution in minutes
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className="h-1.5 flex-1 rounded-full transition-all"
              style={{ background: step >= s ? "var(--accent-primary)" : "var(--input-border, rgba(255,255,255,0.1))" }}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-[12px] p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
            {error}
          </div>
        )}

        {/* STEP 1 — Organisation Details */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-[11px] font-medium uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
              Step 1 of 2 — Organisation Details
            </p>

            {/* Type toggle */}
            <div className="flex gap-2">
              {(["SCHOOL", "CORPORATE"] as OrgType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => set("type", t)}
                  className="flex-1 rounded-[14px] py-3 text-[12px] font-medium transition-all"
                  style={{
                    background: form.type === t ? "rgba(111,255,233,0.12)" : "var(--bg-card)",
                    border: `1px solid ${form.type === t ? "rgba(111,255,233,0.25)" : "var(--border-card)"}`,
                    color: form.type === t ? "var(--accent-primary)" : "var(--text-secondary)",
                  }}
                >
                  {t === "SCHOOL" ? "🏫 School" : "🏢 Corporate"}
                </button>
              ))}
            </div>

            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                {form.type === "SCHOOL" ? "School Name" : "Organisation Name"}
              </p>
              <input
                className="input-field w-full"
                placeholder={form.type === "SCHOOL" ? "e.g. Delhi Public School, Sector 12" : "e.g. Infosys Limited"}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>City</p>
                <input className="input-field w-full" placeholder="Jaipur" value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div>
                <p className="mb-1.5 text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Phone</p>
                <input className="input-field w-full" placeholder="98765 43210" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
              </div>
            </div>

            {form.type === "SCHOOL" && (
              <div>
                <p className="mb-1.5 text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Approx. Student Strength</p>
                <select className="input-field w-full" value={form.size} onChange={(e) => set("size", e.target.value)}>
                  <option value="">Select range</option>
                  {SCHOOL_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            <button
              onClick={() => {
                if (!form.name.trim()) { setError("Organisation name is required"); return; }
                if (!form.city.trim()) { setError("City is required"); return; }
                setError("");
                setStep(2);
              }}
              className="cta-button flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={15} />
            </button>

            <p className="text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
              Already registered?{" "}
              <button onClick={() => router.push("/login")} className="font-medium" style={{ color: "var(--accent-primary)" }}>
                Sign in
              </button>
            </p>
          </div>
        )}

        {/* STEP 2 — Admin Account */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-[11px] font-medium uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
              Step 2 of 2 — {form.type === "SCHOOL" ? "Principal / Coordinator" : "HR / Admin"} Account
            </p>

            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Your Name</p>
              <input
                className="input-field w-full"
                placeholder={form.type === "SCHOOL" ? "Principal's full name" : "Admin's full name"}
                value={form.principalName}
                onChange={(e) => set("principalName", e.target.value)}
              />
            </div>

            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Work Email</p>
              <input
                className="input-field w-full"
                type="email"
                placeholder="principal@school.edu.in"
                value={form.principalEmail}
                onChange={(e) => set("principalEmail", e.target.value)}
              />
            </div>

            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Password</p>
              <div className="relative">
                <input
                  className="input-field w-full pr-12"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.principalPassword}
                  onChange={(e) => set("principalPassword", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setError(""); setStep(1); }}
                className="flex-1 rounded-[14px] py-3 text-[13px] font-medium"
                style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-card)" }}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="cta-button flex-1"
              >
                {loading ? "Creating…" : "Register"}
              </button>
            </div>

            <p className="text-center text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
              By registering you agree to our terms of service. Your org code and login details will be shown after registration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
