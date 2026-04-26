"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, BellOff, Calendar, MessageSquare, AlertCircle } from "lucide-react";

const DEMO_NOTIFS = [
  {
    id: 1,
    icon: Calendar,
    iconColor: "var(--accent-primary)",
    iconBg: "rgba(111,255,233,0.1)",
    title: "Session Reminder",
    body: "Your counselling session is scheduled for tomorrow at 10:00 AM.",
    time: "2h ago",
    read: false,
  },
  {
    id: 2,
    icon: MessageSquare,
    iconColor: "#A78BFA",
    iconBg: "rgba(167,139,250,0.1)",
    title: "New Resource Available",
    body: "A new theory session on Stress Management has been added for you.",
    time: "1d ago",
    read: true,
  },
  {
    id: 3,
    icon: AlertCircle,
    iconColor: "#FFD93D",
    iconBg: "rgba(255,217,61,0.1)",
    title: "Assessment Due",
    body: "Your monthly wellness check-in is ready. It takes only 3 minutes.",
    time: "3d ago",
    read: true,
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState(DEMO_NOTIFS);

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-[10px]"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", color: "var(--text-muted)" }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-heading text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Notifications
            </h1>
            {unread > 0 && (
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{unread} unread</p>
            )}
          </div>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="text-[12px] font-medium"
            style={{ color: "var(--accent-primary)" }}
          >
            Mark all read
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="glass-card p-8 text-center" style={{ borderRadius: "20px" }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[14px]" style={{ background: "var(--tag-bg)" }}>
            <BellOff size={22} style={{ color: "var(--accent-primary)" }} />
          </div>
          <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>All caught up!</p>
          <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>No notifications right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => {
            const Icon = n.icon;
            return (
              <button
                key={n.id}
                onClick={() => setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                className="glass-card w-full p-4 text-left transition-all"
                style={{ borderRadius: "16px", opacity: n.read ? 0.7 : 1 }}
              >
                <div className="flex gap-3">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]"
                    style={{ background: n.iconBg }}
                  >
                    <Icon size={18} style={{ color: n.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: "var(--accent-primary)" }} />
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{n.body}</p>
                    <p className="mt-1.5 text-[10px]" style={{ color: "var(--text-muted)" }}>{n.time}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Push notification prefs */}
      <div className="glass-card mt-6 p-5" style={{ borderRadius: "16px" }}>
        <div className="mb-3 flex items-center gap-2">
          <Bell size={14} style={{ color: "var(--accent-primary)" }} />
          <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>Notification Preferences</p>
        </div>
        {[
          { label: "Session reminders", desc: "Before scheduled sessions" },
          { label: "Assessment nudges", desc: "Monthly wellness check-in" },
          { label: "New resources", desc: "Theory sessions and exercises" },
        ].map((pref) => (
          <div key={pref.label} className="flex items-center justify-between py-2.5" style={{ borderTop: "1px solid var(--border-card)" }}>
            <div>
              <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{pref.label}</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{pref.desc}</p>
            </div>
            <div
              className="relative h-5 w-9 cursor-pointer rounded-full transition-colors"
              style={{ background: "var(--accent-primary)" }}
            >
              <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-[#0B0C10] transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
