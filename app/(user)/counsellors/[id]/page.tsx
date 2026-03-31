"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star, Calendar } from "lucide-react";
import { getCounsellorApi } from "@/lib/counsellors";

interface CounsellorTag {
  id: number;
  name: string;
}

interface CounsellorDetail {
  id: number;
  name: string;
  specialization: string;
  qualifications: string;
  experience: number;
  bio: string;
  rating: number;
  photo: string | null;
  tags: CounsellorTag[];
}

const AVATAR_COLORS = [
  "#6FFFE9",
  "#A78BFA",
  "#FF6B6B",
  "#FFD93D",
  "#5BC0BE",
  "#4ADE80",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function CounsellorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [counsellor, setCounsellor] = useState<CounsellorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    async function fetch() {
      try {
        setLoading(true);
        setError("");
        const res = await getCounsellorApi(id);
        setCounsellor(res.data);
      } catch {
        setError("Failed to load counsellor details");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (error || !counsellor) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <p className="text-[13px]" style={{ color: "#FF6B6B" }}>
          {error || "Counsellor not found"}
        </p>
        <button
          onClick={() => router.push("/counsellors")}
          className="mt-4 text-[12px] font-medium"
          style={{ color: "var(--accent-primary)" }}
        >
          Back to Counsellors
        </button>
      </div>
    );
  }

  const avatarColor = AVATAR_COLORS[counsellor.id % AVATAR_COLORS.length];

  // Parse qualifications: split by newline or bullet points
  const qualificationLines = counsellor.qualifications
    .split(/\n|•|;/)
    .map((q) => q.trim())
    .filter(Boolean);

  return (
    <div>
      {/* Back arrow */}
      <button
        onClick={() => router.push("/counsellors")}
        className="mb-6"
        style={{ color: "var(--text-muted)" }}
      >
        <ArrowLeft size={18} />
      </button>

      {/* Hero - centered */}
      <div className="flex flex-col items-center">
        {/* Avatar */}
        <div
          className="flex h-[80px] w-[80px] items-center justify-center rounded-[28px] text-[28px] font-bold"
          style={{
            background: `${avatarColor}20`,
            color: avatarColor,
          }}
        >
          {counsellor.photo ? (
            <img
              src={counsellor.photo}
              alt={counsellor.name}
              className="h-full w-full rounded-[28px] object-cover"
            />
          ) : (
            getInitials(counsellor.name)
          )}
        </div>

        {/* Name */}
        <h1
          className="font-heading mt-4 text-[20px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {counsellor.name}
        </h1>

        {/* Specialization */}
        <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
          {counsellor.specialization}
        </p>

        {/* Rating + Sessions */}
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Star size={13} fill="#FFD93D" stroke="#FFD93D" />
            <span className="text-[12px] font-medium" style={{ color: "#FFD93D" }}>
              {counsellor.rating.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={13} style={{ color: "var(--text-muted)" }} />
            <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              {counsellor.experience} yrs experience
            </span>
          </div>
        </div>
      </div>

      {/* Tag cloud */}
      {counsellor.tags && counsellor.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {counsellor.tags.map((t) => (
            <span key={t.id} className="tag">
              {t.name}
            </span>
          ))}
        </div>
      )}

      {/* About section */}
      {counsellor.bio && (
        <div className="glass-card mt-6 p-4">
          <p
            className="text-[11px] font-medium uppercase tracking-[1.5px]"
            style={{ color: "var(--text-muted)" }}
          >
            About
          </p>
          <p className="mt-3 text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {counsellor.bio}
          </p>
        </div>
      )}

      {/* Qualifications section */}
      {qualificationLines.length > 0 && (
        <div className="glass-card mt-4 p-4">
          <p
            className="text-[11px] font-medium uppercase tracking-[1.5px]"
            style={{ color: "var(--text-muted)" }}
          >
            Qualifications
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {qualificationLines.map((q, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-[6px] block h-[6px] w-[6px] flex-shrink-0 rounded-full"
                  style={{ background: "var(--accent-primary)" }}
                />
                <span
                  className="text-[12px] leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {q}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
