"use client";

import { useState } from "react";
import { Mail, MessageCircle, Phone, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const CONTACT_EMAIL = "hello@snowflakescounselling.com";
const CONTACT_WHATSAPP = ""; // Fill in WhatsApp number if available

const TOPICS = [
  "General counselling enquiry",
  "Anxiety & stress management",
  "Depression support",
  "Relationship issues",
  "Work-life balance",
  "Academic pressure",
  "Grief & loss",
  "Other",
];

export default function BookPage() {
  const { user } = useAuthStore();
  const [selectedTopic, setSelectedTopic] = useState("");
  const [sent, setSent] = useState(false);

  function buildEmailBody() {
    const name = user?.name || "";
    const email = user?.email || "";
    const topic = selectedTopic || "General enquiry";
    return encodeURIComponent(
      `Hi Snowflakes Counselling,\n\nI would like to enquire about counselling support.\n\nName: ${name}\nEmail: ${email}\nTopic: ${topic}\n\nPlease get back to me at your earliest convenience.\n\nThank you.`
    );
  }

  function handleEmail() {
    const subject = encodeURIComponent(`Counselling Enquiry — ${selectedTopic || "General"}`);
    const body = buildEmailBody();
    window.open(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`, "_blank");
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: "var(--tag-bg)" }}
        >
          <CheckCircle2 size={40} style={{ color: "var(--accent-primary)" }} />
        </div>
        <h1
          className="font-heading text-[24px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Request Sent!
        </h1>
        <p className="mt-3 max-w-[260px] text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Your email client has been opened. Snowflakes Counselling will get back to you soon.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-8 text-[13px] font-medium"
          style={{ color: "var(--accent-primary)" }}
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1
        className="font-heading text-[22px] font-semibold leading-tight"
        style={{ color: "var(--text-primary)" }}
      >
        Connect with a{" "}
        <span
          style={{
            background: "var(--gradient-cta)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Counsellor
        </span>
      </h1>
      <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
        Reach out to Snowflakes Counselling — we'll get back to you within 24 hours
      </p>

      {/* Topic selection */}
      <div className="mt-6">
        <p
          className="mb-3 text-[11px] font-medium uppercase tracking-[1.5px]"
          style={{ color: "var(--text-muted)" }}
        >
          What would you like to discuss?
        </p>
        <div className="flex flex-col gap-2">
          {TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className="flex items-center gap-3 rounded-[16px] p-4 text-left transition-all"
              style={{
                background: selectedTopic === topic ? "var(--pill-active-bg)" : "var(--bg-card)",
                border: `1px solid ${selectedTopic === topic ? "var(--pill-active-border)" : "var(--border-card)"}`,
              }}
            >
              <div
                className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center rounded-full"
                style={{
                  background: selectedTopic === topic ? "var(--gradient-cta)" : "transparent",
                  border: selectedTopic === topic ? "none" : "2px solid var(--border-card)",
                }}
              >
                {selectedTopic === topic && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="var(--cta-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span
                className="text-[13px]"
                style={{
                  color: selectedTopic === topic ? "var(--text-primary)" : "var(--text-secondary)",
                  fontWeight: selectedTopic === topic ? 600 : 400,
                }}
              >
                {topic}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Contact options */}
      <div className="mt-6">
        <p
          className="mb-3 text-[11px] font-medium uppercase tracking-[1.5px]"
          style={{ color: "var(--text-muted)" }}
        >
          Contact via
        </p>

        {/* Email button */}
        <button
          onClick={handleEmail}
          className="cta-button flex w-full items-center justify-center gap-2"
        >
          <Mail size={16} />
          Send Email Enquiry
        </button>

        {/* Contact info */}
        <div className="glass-card mt-4 p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-icon"
              style={{ background: "var(--tag-bg)" }}
            >
              <Mail size={16} style={{ color: "var(--accent-primary)" }} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Email</p>
              <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                {CONTACT_EMAIL}
              </p>
            </div>
          </div>

          <div
            className="my-3 border-t"
            style={{ borderColor: "var(--border-card)" }}
          />

          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-icon"
              style={{ background: "var(--tag-bg)" }}
            >
              <MessageCircle size={16} style={{ color: "var(--accent-primary)" }} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Response time</p>
              <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                Within 24 hours
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          All conversations are completely confidential.{"\n"}
          You are safe here.
        </p>
      </div>
    </div>
  );
}
