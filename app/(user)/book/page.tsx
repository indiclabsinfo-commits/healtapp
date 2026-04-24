"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Video, MapPin, Star } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { listCounsellorsApi } from "@/lib/counsellors";
import { getAvailabilityApi, bookConsultationApi } from "@/lib/consultations";

type Step = "counsellor" | "slot" | "confirm" | "success";
type SessionType = "ONLINE" | "IN_PERSON";

interface Counsellor {
  id: number;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  bio: string;
  photo?: string;
  tags: { id: number; name: string }[];
}

function getDates(count = 14) {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function fmt(d: Date) {
  return d.toISOString().split("T")[0];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function BookPage() {
  const { user, memberships } = useAuthStore();
  const orgId = memberships[0]?.organization.id ?? 0;

  const [step, setStep] = useState<Step>("counsellor");

  // Step 1
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [loadingCounsellors, setLoadingCounsellors] = useState(true);
  const [selected, setSelected] = useState<Counsellor | null>(null);

  // Step 2
  const dates = getDates(14);
  const [dateIdx, setDateIdx] = useState(0);
  const [sessionType, setSessionType] = useState<SessionType>("ONLINE");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Step 3 / 4
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookedDetails, setBookedDetails] = useState<{ date: string; time: string; counsellor: string } | null>(null);

  useEffect(() => {
    listCounsellorsApi({ limit: 50 })
      .then((r) => setCounsellors(r.data ?? []))
      .catch(() => setCounsellors([]))
      .finally(() => setLoadingCounsellors(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    setSlots([]);
    getAvailabilityApi(selected.id, fmt(dates[dateIdx]))
      .then((r) => setSlots(r.data?.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selected, dateIdx]);

  async function handleBook() {
    if (!selected || !selectedSlot) return;
    setBooking(true);
    setBookingError("");
    try {
      await bookConsultationApi(
        { counsellorId: selected.id, date: fmt(dates[dateIdx]), time: selectedSlot, type: sessionType },
        orgId
      );
      setBookedDetails({ date: fmt(dates[dateIdx]), time: selectedSlot, counsellor: selected.name });
      setStep("success");
    } catch (err: any) {
      setBookingError(err.response?.data?.error || "Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  function reset() {
    setStep("counsellor");
    setSelected(null);
    setDateIdx(0);
    setSelectedSlot(null);
    setBookedDetails(null);
    setBookingError("");
  }

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  if (step === "success" && bookedDetails) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "var(--tag-bg)" }}>
          <CheckCircle2 size={40} style={{ color: "var(--accent-primary)" }} />
        </div>
        <h1 className="font-heading text-[24px] font-semibold" style={{ color: "var(--text-primary)" }}>Session Booked!</h1>
        <p className="mt-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>with {bookedDetails.counsellor}</p>
        <div className="glass-card mt-6 w-full p-4 text-left">
          <Row label="Date" value={bookedDetails.date} />
          <Row label="Time" value={bookedDetails.time} />
          <Row label="Type" value={sessionType} />
        </div>
        <p className="mt-4 text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Your counsellor will be in touch to confirm.
        </p>
        <button onClick={reset} className="mt-6 text-[13px] font-medium" style={{ color: "var(--accent-primary)" }}>
          Book another session
        </button>
      </div>
    );
  }

  // ── STEP 3: CONFIRM ────────────────────────────────────────────────────────
  if (step === "confirm" && selected && selectedSlot) {
    const d = dates[dateIdx];
    return (
      <div>
        <button onClick={() => setStep("slot")} className="mb-4 flex items-center gap-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
          <ChevronLeft size={14} /> Back
        </button>
        <h1 className="font-heading text-[22px] font-semibold" style={{ color: "var(--text-primary)" }}>Confirm Booking</h1>
        <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>Review your session details</p>

        <div className="glass-card mt-6 p-5">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Counsellor</p>
          <CounsellorRow c={selected} />
        </div>

        <div className="glass-card mt-4 p-5">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Session Details</p>
          <Row label="Date" value={`${DAY_LABELS[d.getDay()]}, ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`} />
          <Row label="Time" value={selectedSlot} />
          <Row label="Type" value={sessionType === "ONLINE" ? "Online (Video Call)" : "In-Person"} />
        </div>

        {bookingError && (
          <div className="mt-4 rounded-[12px] p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
            {bookingError}
          </div>
        )}

        <button
          onClick={handleBook}
          disabled={booking}
          className="cta-button mt-6"
        >
          {booking ? "Booking…" : "Confirm Session"}
        </button>
      </div>
    );
  }

  // ── STEP 2: DATE / TIME / TYPE ─────────────────────────────────────────────
  if (step === "slot" && selected) {
    const d = dates[dateIdx];
    return (
      <div>
        <button onClick={() => setStep("counsellor")} className="mb-4 flex items-center gap-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
          <ChevronLeft size={14} /> Back
        </button>
        <h1 className="font-heading text-[22px] font-semibold" style={{ color: "var(--text-primary)" }}>Choose a Slot</h1>
        <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>with {selected.name}</p>

        {/* Date picker */}
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Date</p>
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {dates.map((date, i) => {
              const isActive = i === dateIdx;
              return (
                <button
                  key={i}
                  onClick={() => setDateIdx(i)}
                  className="flex flex-shrink-0 flex-col items-center rounded-[14px] px-3 py-2 text-center"
                  style={{
                    background: isActive ? "var(--gradient-cta)" : "var(--bg-card)",
                    border: `1px solid ${isActive ? "transparent" : "var(--border-card)"}`,
                    minWidth: 52,
                  }}
                >
                  <span className="text-[10px]" style={{ color: isActive ? "#0B0C10" : "var(--text-muted)" }}>
                    {DAY_LABELS[date.getDay()]}
                  </span>
                  <span className="mt-0.5 text-[16px] font-bold" style={{ color: isActive ? "#0B0C10" : "var(--text-primary)" }}>
                    {date.getDate()}
                  </span>
                  <span className="text-[9px]" style={{ color: isActive ? "#0B0C10" : "var(--text-muted)" }}>
                    {MONTH_LABELS[date.getMonth()]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Session type */}
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>Session Type</p>
          <div className="flex gap-2">
            {(["ONLINE", "IN_PERSON"] as SessionType[]).map((t) => {
              const isActive = sessionType === t;
              return (
                <button
                  key={t}
                  onClick={() => setSessionType(t)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-[14px] py-3 text-[12px] font-medium"
                  style={{
                    background: isActive ? "rgba(111,255,233,0.12)" : "var(--bg-card)",
                    border: `1px solid ${isActive ? "rgba(111,255,233,0.25)" : "var(--border-card)"}`,
                    color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                  }}
                >
                  {t === "ONLINE" ? <Video size={14} /> : <MapPin size={14} />}
                  {t === "ONLINE" ? "Online" : "In-Person"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
            Available Times — {DAY_LABELS[d.getDay()]}, {d.getDate()} {MONTH_LABELS[d.getMonth()]}
          </p>
          {loadingSlots ? (
            <p className="py-4 text-[12px]" style={{ color: "var(--text-muted)" }}>Loading slots…</p>
          ) : slots.length === 0 ? (
            <p className="py-4 text-[12px]" style={{ color: "var(--text-muted)" }}>No slots available on this date. Try another day.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => {
                const isActive = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className="flex items-center justify-center gap-1 rounded-[12px] py-2.5 text-[12px] font-medium"
                    style={{
                      background: isActive ? "rgba(111,255,233,0.12)" : "var(--bg-card)",
                      border: `1px solid ${isActive ? "rgba(111,255,233,0.25)" : "var(--border-card)"}`,
                      color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                    }}
                  >
                    <Clock size={11} />
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => setStep("confirm")}
          disabled={!selectedSlot}
          className="cta-button mt-6"
          style={{ opacity: selectedSlot ? 1 : 0.4 }}
        >
          Continue
        </button>
      </div>
    );
  }

  // ── STEP 1: SELECT COUNSELLOR ───────────────────────────────────────────────
  return (
    <div>
      <h1 className="font-heading text-[22px] font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
        Book a{" "}
        <span style={{ background: "var(--gradient-cta)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Session
        </span>
      </h1>
      <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>Choose a counsellor to get started</p>

      <div className="mt-5 flex flex-col gap-3">
        {loadingCounsellors && (
          <p className="py-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>Loading counsellors…</p>
        )}
        {!loadingCounsellors && counsellors.length === 0 && (
          <p className="py-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>No counsellors available right now.</p>
        )}
        {counsellors.map((c) => (
          <button
            key={c.id}
            onClick={() => { setSelected(c); setStep("slot"); }}
            className="glass-card flex items-start gap-4 p-4 text-left"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[16px] text-[18px] font-bold" style={{ background: "var(--tag-bg)", color: "var(--accent-primary)" }}>
              {c.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>{c.name}</p>
              <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>{c.specialization} · {c.experience} yrs</p>
              {c.rating > 0 && (
                <div className="mt-1 flex items-center gap-1">
                  <Star size={11} style={{ color: "#FFD93D" }} fill="#FFD93D" />
                  <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{c.rating.toFixed(1)}</span>
                </div>
              )}
              {c.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.tags.slice(0, 3).map((tag) => (
                    <span key={tag.id} className="rounded-pill px-2 py-0.5 text-[9px] font-medium" style={{ background: "var(--tag-bg)", color: "var(--accent-primary)" }}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <ChevronRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

function CounsellorRow({ c }: { c: Counsellor }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] text-[16px] font-bold" style={{ background: "var(--tag-bg)", color: "var(--accent-primary)" }}>
        {c.name.charAt(0)}
      </div>
      <div>
        <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>{c.name}</p>
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{c.specialization}</p>
      </div>
    </div>
  );
}
