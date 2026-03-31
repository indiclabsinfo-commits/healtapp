"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ClipboardList, CheckCircle2 } from "lucide-react";
import { listQuestionnairesApi, getQuestionnaireApi } from "@/lib/questionnaires";
import { submitAssessmentApi } from "@/lib/assessments";

interface Question {
  id: number;
  text: string;
  type: "MCQ" | "SCALE" | "YESNO";
  options: any;
}

interface Questionnaire {
  id: number;
  title: string;
  categoryId: number;
  levelId: number;
  questionIds: number[];
  questions?: Question[];
}

export default function AssessmentPage() {
  // Browse mode state
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Quiz mode state
  const [quizMode, setQuizMode] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Questionnaire | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [submitting, setSubmitting] = useState(false);

  // Result state
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Scale slider state
  const [scaleValue, setScaleValue] = useState(5);

  useEffect(() => {
    fetchQuestionnaires();
  }, []);

  async function fetchQuestionnaires() {
    try {
      setLoading(true);
      const res = await listQuestionnairesApi({ published: "true" });
      setQuestionnaires(res.data || []);
    } catch {
      setError("Failed to load assessments");
    } finally {
      setLoading(false);
    }
  }

  async function startQuiz(id: number) {
    try {
      setLoading(true);
      setError("");
      const res = await getQuestionnaireApi(id);
      setActiveQuiz(res.data);
      setCurrentIndex(0);
      setAnswers({});
      setScaleValue(5);
      setQuizMode(true);
      setShowResult(false);
      setScore(null);
    } catch {
      setError("Failed to load questionnaire");
    } finally {
      setLoading(false);
    }
  }

  function exitQuiz() {
    setQuizMode(false);
    setActiveQuiz(null);
    setCurrentIndex(0);
    setAnswers({});
    setShowResult(false);
    setScore(null);
  }

  const questions = activeQuiz?.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === totalQuestions - 1;

  function selectAnswer(value: any) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  }

  function handleNext() {
    if (!currentQuestion) return;

    // For SCALE type, save current slider value if not already answered
    if (currentQuestion.type === "SCALE" && answers[currentQuestion.id] === undefined) {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: scaleValue }));
    }

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentIndex((prev) => prev + 1);
      // Reset scale for next question
      const nextQ = questions[currentIndex + 1];
      if (nextQ?.type === "SCALE") {
        setScaleValue(answers[nextQ.id] ?? 5);
      }
    }
  }

  async function handleSubmit() {
    if (!activeQuiz) return;
    try {
      setSubmitting(true);
      const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: Number(questionId),
        answer,
      }));
      // Include current scale if not saved yet
      if (currentQuestion?.type === "SCALE" && !answers[currentQuestion.id]) {
        answerArray.push({ questionId: currentQuestion.id, answer: scaleValue });
      }
      const res = await submitAssessmentApi({
        questionnaireId: activeQuiz.id,
        answers: answerArray,
      });
      setScore(res.data?.score ?? 0);
      setShowResult(true);
    } catch {
      setError("Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  }

  const hasAnswer = currentQuestion
    ? currentQuestion.type === "SCALE" || answers[currentQuestion.id] !== undefined
    : false;

  // --- RESULT SCREEN ---
  if (showResult && quizMode) {
    return (
      <div className="flex flex-col items-center pt-12">
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-[24px]"
          style={{ background: "var(--tag-bg)" }}
        >
          <CheckCircle2 size={40} style={{ color: "var(--accent-primary)" }} />
        </div>
        <h1
          className="font-heading text-[24px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Assessment Complete
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: "var(--text-muted)" }}>
          Here are your results
        </p>

        <div className="glass-card mt-8 w-full max-w-sm p-6 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
            Your Score
          </p>
          <p
            className="font-heading mt-2 text-[48px] font-bold"
            style={{ color: "var(--accent-primary)" }}
          >
            {score !== null ? `${Math.round(score)}%` : "--"}
          </p>
          <p className="mt-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
            {activeQuiz?.title}
          </p>
        </div>

        <button onClick={exitQuiz} className="cta-button mt-8 max-w-sm">
          Back to Assessments
        </button>
      </div>
    );
  }

  // --- QUIZ MODE ---
  if (quizMode && activeQuiz && currentQuestion) {
    // Parse options — could be JSON string or already parsed
    let parsedOptions: any = currentQuestion.options;
    if (typeof parsedOptions === 'string') {
      try { parsedOptions = JSON.parse(parsedOptions); } catch { parsedOptions = []; }
    }
    // MCQ options are [{text, score}, ...], extract text for display
    const optionsList: { text: string; score?: number }[] = Array.isArray(parsedOptions)
      ? parsedOptions.map((o: any) => typeof o === 'string' ? { text: o } : o)
      : [];
    // SCALE options have {min, max, labels}
    const scaleMax = parsedOptions?.max || 10;
    const scaleMin = parsedOptions?.min || 1;

    return (
      <div className="flex flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button onClick={exitQuiz} style={{ color: "var(--text-muted)" }}>
            <ArrowLeft size={18} />
          </button>
          <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Self Assessment
          </p>
          <p className="text-[12px] font-semibold" style={{ color: "var(--text-muted)" }}>
            {currentIndex + 1}/{totalQuestions}
          </p>
        </div>

        {/* Segmented progress bar */}
        <div className="mb-6 flex gap-[3px]">
          {questions.map((_, i) => (
            <div
              key={i}
              className="h-[4px] flex-1 rounded-full transition-all duration-300"
              style={{
                background:
                  i <= currentIndex
                    ? "var(--gradient-cta)"
                    : "var(--progress-bg)",
              }}
            />
          ))}
        </div>

        {/* Category tag + completion */}
        <div className="mb-6 flex items-center justify-between">
          <span className="tag">{activeQuiz.title}</span>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {Math.round(((currentIndex + 1) / totalQuestions) * 100)}% complete
          </span>
        </div>

        {/* Question */}
        <h2
          className="font-heading mb-8 text-[22px] font-semibold leading-snug"
          style={{ color: "var(--text-primary)" }}
        >
          {currentQuestion.text.replace(/\?+$/, "")}
          <span style={{ color: "var(--accent-primary)" }}>?</span>
        </h2>

        {/* Answer options */}
        <div className="flex flex-col gap-[10px]">
          {currentQuestion.type === "MCQ" &&
            optionsList.map((option, i) => {
              const isSelected = answers[currentQuestion.id] === option.text;
              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(option.text)}
                  className="flex items-center gap-3 rounded-[16px] p-4 text-left transition-all"
                  style={{
                    background: isSelected
                      ? "var(--pill-active-bg)"
                      : "var(--bg-card)",
                    border: `1px solid ${
                      isSelected
                        ? "var(--pill-active-border)"
                        : "var(--border-card)"
                    }`,
                  }}
                >
                  {/* Radio circle */}
                  <div
                    className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: isSelected
                        ? "var(--gradient-cta)"
                        : "transparent",
                      border: isSelected
                        ? "none"
                        : "2px solid var(--border-card)",
                    }}
                  >
                    {isSelected && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="var(--cta-text)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className="text-[13px]"
                    style={{
                      color: isSelected
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {option.text}
                  </span>
                </button>
              );
            })}

          {currentQuestion.type === "YESNO" && (
            <div className="flex gap-3">
              {["Yes", "No"].map((option) => {
                const isSelected = answers[currentQuestion.id] === option;
                return (
                  <button
                    key={option}
                    onClick={() => selectAnswer(option)}
                    className="flex-1 rounded-[16px] p-4 text-center text-[14px] font-semibold transition-all"
                    style={{
                      background: isSelected
                        ? "var(--gradient-cta)"
                        : "var(--bg-card)",
                      color: isSelected
                        ? "var(--cta-text)"
                        : "var(--text-secondary)",
                      border: `1px solid ${
                        isSelected
                          ? "transparent"
                          : "var(--border-card)"
                      }`,
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === "SCALE" && (
            <div className="glass-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {parsedOptions?.labels?.[scaleMin] || "Low"}
                </span>
                <span
                  className="font-heading text-[32px] font-bold"
                  style={{ color: "var(--accent-primary)" }}
                >
                  {answers[currentQuestion.id] ?? scaleValue}
                </span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {parsedOptions?.labels?.[scaleMax] || "High"}
                </span>
              </div>
              <input
                type="range"
                min={scaleMin}
                max={scaleMax}
                value={answers[currentQuestion.id] ?? scaleValue}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setScaleValue(val);
                  selectAnswer(val);
                }}
                className="w-full accent-[var(--accent-primary)]"
                style={{ accentColor: "var(--accent-primary)" }}
              />
              <div className="mt-2 flex justify-between">
                {Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => (
                  <span
                    key={i}
                    className="text-[9px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {scaleMin + i}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Next / Submit button */}
        <button
          onClick={handleNext}
          disabled={!hasAnswer || submitting}
          className="cta-button mt-8"
        >
          {submitting
            ? "Submitting..."
            : isLastQuestion
            ? "Submit Assessment"
            : "Next Question \u2192"}
        </button>
      </div>
    );
  }

  // --- BROWSE MODE ---
  return (
    <div>
      <h1
        className="font-heading text-[22px] font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Self Assessment
      </h1>
      <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
        Take expert-crafted assessments to understand yourself
      </p>

      {loading && (
        <div className="mt-12 flex justify-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }}
          />
        </div>
      )}

      {error && (
        <div className="glass-card mt-6 p-4 text-center">
          <p className="text-[13px]" style={{ color: "#FF6B6B" }}>
            {error}
          </p>
          <button
            onClick={fetchQuestionnaires}
            className="mt-3 text-[12px] font-medium"
            style={{ color: "var(--accent-primary)" }}
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && questionnaires.length === 0 && (
        <div className="mt-12 flex flex-col items-center">
          <ClipboardList size={48} style={{ color: "var(--text-muted)" }} />
          <p className="mt-4 text-[13px]" style={{ color: "var(--text-muted)" }}>
            No assessments available yet
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6 flex flex-col gap-3">
          {questionnaires.map((q) => {
            const count =
              q.questions?.length ??
              (Array.isArray(q.questionIds) ? q.questionIds.length : 0);
            return (
              <div key={q.id} className="glass-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-icon text-lg"
                      style={{ background: "var(--tag-bg)" }}
                    >
                      <ClipboardList size={20} style={{ color: "var(--accent-primary)" }} />
                    </div>
                    <div>
                      <p
                        className="text-[14px] font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {q.title}
                      </p>
                      <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {count} question{count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => startQuiz(q.id)}
                    className="rounded-pill px-4 py-[6px] text-[11px] font-medium"
                    style={{
                      background: "var(--gradient-cta)",
                      color: "var(--cta-text)",
                    }}
                  >
                    Start
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
