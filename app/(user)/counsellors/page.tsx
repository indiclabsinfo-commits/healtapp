"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Star, Users } from "lucide-react";
import Link from "next/link";
import { listCounsellorsApi } from "@/lib/counsellors";

interface CounsellorTag {
  id: number;
  name: string;
}

interface Counsellor {
  id: number;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  photo: string | null;
  tags: CounsellorTag[];
}

const FILTER_TAGS = ["All", "Anxiety", "Depression", "CBT", "Trauma", "Self-esteem", "Stress"];

const AVATAR_COLORS = [
  "#6FFFE9",
  "#A78BFA",
  "#FF6B6B",
  "#FFD93D",
  "#5BC0BE",
  "#4ADE80",
];

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function CounsellorsPage() {
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const fetchCounsellors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params: { search?: string; tag?: string } = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeFilter !== "All") params.tag = activeFilter;
      const res = await listCounsellorsApi(params);
      setCounsellors(res.data || []);
    } catch {
      setError("Failed to load counsellors");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilter]);

  useEffect(() => {
    fetchCounsellors();
  }, [fetchCounsellors]);

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      // fetchCounsellors triggers via useEffect
    }, 300);
    setSearchTimeout(timeout);
  }

  return (
    <div>
      {/* Title */}
      <h1
        className="font-heading text-[22px] font-semibold leading-tight"
        style={{ color: "var(--text-primary)" }}
      >
        Find Your{"\n"}
        <span
          style={{
            background: "var(--gradient-cta)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Expert
        </span>
      </h1>

      {/* Search bar */}
      <div className="glass-card mt-5 flex items-center gap-3 px-4 py-3">
        <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search by name or specialization..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full bg-transparent text-[13px] outline-none"
          style={{ color: "var(--text-primary)" }}
        />
      </div>

      {/* Filter pills */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {FILTER_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveFilter(tag)}
            className={`flex-shrink-0 ${
              activeFilter === tag ? "pill-active" : "pill-inactive"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-12 flex justify-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }}
          />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="glass-card mt-6 p-4 text-center">
          <p className="text-[13px]" style={{ color: "#FF6B6B" }}>
            {error}
          </p>
          <button
            onClick={fetchCounsellors}
            className="mt-3 text-[12px] font-medium"
            style={{ color: "var(--accent-primary)" }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && counsellors.length === 0 && (
        <div className="mt-12 flex flex-col items-center">
          <Users size={48} style={{ color: "var(--text-muted)" }} />
          <p className="mt-4 text-[13px]" style={{ color: "var(--text-muted)" }}>
            No counsellors found
          </p>
        </div>
      )}

      {/* Counsellor cards */}
      {!loading && !error && (
        <div className="mt-5 flex flex-col gap-3">
          {counsellors.map((c, index) => (
            <Link key={c.id} href={`/counsellors/${c.id}`}>
              <div className="glass-card p-4 transition-all">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className="flex h-[48px] w-[48px] flex-shrink-0 items-center justify-center rounded-icon text-[16px] font-bold"
                    style={{
                      background: `${getAvatarColor(index)}20`,
                      color: getAvatarColor(index),
                    }}
                  >
                    {c.photo ? (
                      <img
                        src={c.photo}
                        alt={c.name}
                        className="h-full w-full rounded-icon object-cover"
                      />
                    ) : (
                      getInitials(c.name)
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[14px] font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {c.name}
                    </p>
                    <p className="mt-[2px] text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {c.specialization} &middot; {c.experience} yrs
                    </p>

                    {/* Rating */}
                    <div className="mt-1 flex items-center gap-1">
                      <Star size={11} fill="#FFD93D" stroke="#FFD93D" />
                      <span className="text-[11px] font-medium" style={{ color: "#FFD93D" }}>
                        {c.rating.toFixed(1)}
                      </span>
                    </div>

                    {/* Tags */}
                    {c.tags && c.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-[6px]">
                        {c.tags.map((t) => (
                          <span key={t.id} className="tag" style={{ fontSize: "9px" }}>
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
