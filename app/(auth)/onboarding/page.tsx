"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const SLIDES = [
  {
    emoji: "\u{1F33F}",
    title: ["Understand", "Your Mind"],
    description:
      "Take expert-crafted assessments and guided breathing exercises to discover your wellness patterns.",
    color: "rgba(111,255,233,0.1)",
  },
  {
    emoji: "\u{1FAC1}",
    title: ["Breathe", "& Relax"],
    description:
      "Guided breathing exercises with animated visual guides to help you manage stress and anxiety.",
    color: "rgba(167,139,250,0.1)",
  },
  {
    emoji: "\u{1F4CA}",
    title: ["Track Your", "Progress"],
    description:
      "Monitor your wellness journey with mood tracking, assessment analytics, and personalized insights.",
    color: "rgba(74,222,128,0.1)",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"splash" | "onboarding">("splash");
  const [splashFading, setSplashFading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-transition from splash to onboarding after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashFading(true);
    }, 2000);

    const transitionTimer = setTimeout(() => {
      setPhase("onboarding");
    }, 2500); // 500ms for fade-out animation

    return () => {
      clearTimeout(timer);
      clearTimeout(transitionTimer);
    };
  }, []);

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  function handleNext() {
    if (isLast) {
      localStorage.setItem("ambrin-onboarded", "true");
      router.push("/login");
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  }

  function handleSkip() {
    localStorage.setItem("ambrin-onboarded", "true");
    router.push("/login");
  }

  return (
    <>
      {/* Full-screen container that escapes the auth layout */}
      <div className="fixed inset-0 z-50">
        {/* ===== SPLASH SCREEN ===== */}
        {phase === "splash" && (
          <div
            className="flex h-full w-full flex-col items-center justify-center transition-opacity duration-500"
            style={{
              background: "#FFFFFF",
              opacity: splashFading ? 0 : 1,
            }}
          >
            {/* Logo image (contains brain + ambrin text + by Snowflakes Counselling) */}
            <Image
              src="/ambrin-logo.jpeg"
              alt="ambrin by Snowflakes Counselling"
              width={280}
              height={420}
              priority
              style={{ objectFit: "contain" }}
            />

            {/* Bottom shimmer bar */}
            <div
              className="absolute bottom-12"
              style={{
                width: "40px",
                height: "3px",
                borderRadius: "2px",
                background:
                  "linear-gradient(90deg, transparent, #6FFFE9, transparent)",
                animation: "shimmer 2s ease-in-out infinite",
              }}
            />
          </div>
        )}

        {/* ===== ONBOARDING SCREEN ===== */}
        {phase === "onboarding" && (
          <div
            className="flex h-full w-full flex-col items-center justify-between px-8 py-12"
            style={{
              background: "var(--gradient-splash)",
              animation: "fadeIn 0.5s ease-out",
            }}
          >
            {/* Floating orb (persists) */}
            <div
              className="pointer-events-none absolute"
              style={{
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                background: "var(--accent-primary)",
                opacity: 0.06,
                filter: "blur(60px)",
                top: "20%",
                right: "-40px",
              }}
            />

            {/* Skip button */}
            <div className="flex w-full max-w-sm justify-end">
              <button
                onClick={handleSkip}
                className="text-[12px] font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--text-muted)" }}
              >
                Skip {"\u2192"}
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div
                className="mb-8 flex items-center justify-center"
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "40px",
                  background: slide.color,
                }}
              >
                <span
                  className="text-[56px]"
                  style={{ animation: "float 3s ease-in-out infinite" }}
                >
                  {slide.emoji}
                </span>
              </div>

              {/* Title */}
              <h1
                className="font-heading text-[24px] font-semibold leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {slide.title[0]}
                <br />
                <span
                  style={{
                    background: "var(--gradient-cta)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {slide.title[1]}
                </span>
              </h1>

              {/* Description */}
              <p
                className="mt-4 max-w-[220px] text-[13px] leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {slide.description}
              </p>
            </div>

            {/* Bottom section */}
            <div className="flex w-full max-w-sm flex-col items-center gap-6">
              {/* Dot indicators */}
              <div className="flex items-center gap-2">
                {SLIDES.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === currentSlide ? "24px" : "8px",
                      height: "3px",
                      background:
                        i === currentSlide
                          ? "var(--accent-primary)"
                          : "var(--progress-bg)",
                    }}
                  />
                ))}
              </div>

              {/* CTA */}
              <button onClick={handleNext} className="cta-button w-full">
                {isLast ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes shimmer {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
