"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-8"
      style={{ background: "var(--bg-body)" }}
    >
      <div
        className="mb-6 flex h-[80px] w-[80px] items-center justify-center rounded-[24px] text-4xl"
        style={{ background: "var(--tag-bg)" }}
      >
        🔍
      </div>
      <h1
        className="font-heading text-[28px] font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Page Not Found
      </h1>
      <p
        className="mt-2 max-w-[280px] text-center text-[13px]"
        style={{ color: "var(--text-muted)" }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="cta-button mt-8 max-w-[200px] text-center">
        Go Home
      </Link>
    </div>
  );
}
