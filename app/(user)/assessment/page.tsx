"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Brain, HeartPulse, CheckCircle2, Phone, ClipboardList } from "lucide-react";
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
  language: string;
  questionIds: number[];
  questions?: Question[];
}

type Lang = "en" | "hi" | "gu";

const LANG_LABELS: Record<Lang, string> = { en: "English", hi: "हिंदी", gu: "ગુ" };

const UI_T: Record<Lang, Record<string, string>> = {
  en: {
    complete: "Assessment Complete",
    level: "Level",
    score: "Score",
    clinicalRange: "Clinical range",
    severityScale: "Severity Scale",
    you: "YOU",
    back: "← Back to Assessments",
    connect: "Connect with a Counsellor",
  },
  hi: {
    complete: "मूल्यांकन पूर्ण",
    level: "स्तर",
    score: "स्कोर",
    clinicalRange: "नैदानिक सीमा",
    severityScale: "गंभीरता पैमाना",
    you: "आप",
    back: "← मूल्यांकन पर वापस",
    connect: "काउंसलर से जुड़ें",
  },
  gu: {
    complete: "મૂ ← .",
    level: "સ્ ← .",
    score: "← .",
    clinicalRange: "← .",
    severityScale: "← .",
    you: "← .",
    back: "← .",
    connect: "← .",
  },
};

const LEVEL_T: Record<string, Record<Lang, string>> = {
  Minimal:            { en: "Minimal",            hi: "न्यूनतम",      gu: "ઓ ←." },
  Mild:               { en: "Mild",               hi: "हल्का",         gu: "← ." },
  Moderate:           { en: "Moderate",           hi: "मध्यम",         gu: "← ." },
  "Moderately Severe":{ en: "Moderately Severe",  hi: "मध्यम गंभीर",  gu: "← ." },
  Severe:             { en: "Severe",             hi: "गंभीर",         gu: "← ." },
};

const MSG_T: Record<string, Record<Lang, Record<string, { text: string; cta: boolean }>>> = {
  PHQ9: {
    en: {
      Minimal: { text: "Your responses suggest minimal depressive symptoms. Keep up healthy habits — exercise, sleep, and social connection go a long way.", cta: false },
      Mild: { text: "Mild depressive symptoms noted. Explore our Theory sessions and Breathing exercises. Consider speaking to a counsellor if this persists.", cta: false },
      Moderate: { text: "Moderate symptoms detected. Talking to a counsellor can make a significant difference. You don't have to go through this alone.", cta: true },
      "Moderately Severe": { text: "Significant symptoms noted. We recommend connecting with a counsellor soon for support and a care plan.", cta: true },
      Severe: { text: "Severe symptoms detected. Please reach out to a counsellor or mental health professional as soon as possible.", cta: true },
    },
    hi: {
      Minimal: { text: "आपकी प्रतिक्रियाएँ न्यूनतम अवसादग्रस्त लक्षण दर्शाती हैं। स्वस्थ आदतें बनाए रखें — व्यायाम, नींद और सामाजिक संपर्क बहुत सहायक होते हैं।", cta: false },
      Mild: { text: "हल्के अवसाद के लक्षण नोट किए गए। थ्योरी सत्र और श्वास व्यायाम आज़माएँ। अगर यह जारी रहे तो काउंसलर से बात करें।", cta: false },
      Moderate: { text: "मध्यम लक्षण मिले। काउंसलर से बात करना बड़ा अंतर ला सकता है। आपको यह अकेले नहीं झेलना है।", cta: true },
      "Moderately Severe": { text: "महत्वपूर्ण लक्षण नोट किए गए। हम जल्द ही सहायता और देखभाल योजना के लिए काउंसलर से जुड़ने की सलाह देते हैं।", cta: true },
      Severe: { text: "गंभीर लक्षण मिले। कृपया जल्द से जल्द किसी काउंसलर या मानसिक स्वास्थ्य पेशेवर से संपर्क करें।", cta: true },
    },
    gu: {
      Minimal: { text: "તmarna javabo otama niraasha na lakshano suchave chhe. Swasth aadato jaLvavI - kasarat, ugh ane samajik jodani ghani madad kare chhe.", cta: false },
      Mild: { text: "Halva avasad na lakshano nodhya. Theory session ane shas ni kasarat try karo. Jo chalu rahe to counselor sathe vat karo.", cta: false },
      Moderate: { text: "Madhyam lakshano jova malya. Counselor sathe vat karavi mhattvano fark lai shake chhe. Tame ekala nathi.", cta: true },
      "Moderately Severe": { text: "Mahattvapurn lakshano nodhya. Jaldi counselor sathe judavani ane care plan maate salamat apiye chhiye.", cta: true },
      Severe: { text: "Gambhir lakshano jova malya. Krupa kari jaldi koi counselor ya mental health professional sathe sampark karo.", cta: true },
    },
  },
  GAD7: {
    en: {
      Minimal: { text: "Your responses suggest minimal anxiety. Continue with your current self-care routines.", cta: false },
      Mild: { text: "Mild anxiety symptoms noted. Try breathing exercises and relaxation techniques. A counsellor can also help.", cta: false },
      Moderate: { text: "Moderate anxiety detected. A counsellor can help you develop effective coping strategies.", cta: true },
      Severe: { text: "Severe anxiety symptoms detected. Please connect with a mental health professional for proper support.", cta: true },
    },
    hi: {
      Minimal: { text: "आपकी प्रतिक्रियाएँ न्यूनतम चिंता दर्शाती हैं। अपनी वर्तमान स्वयं-देखभाल दिनचर्या जारी रखें।", cta: false },
      Mild: { text: "हल्के चिंता के लक्षण नोट किए गए। श्वास व्यायाम और विश्राम तकनीक आज़माएँ। काउंसलर भी मदद कर सकते हैं।", cta: false },
      Moderate: { text: "मध्यम चिंता मिली। काउंसलर प्रभावी सामना रणनीतियाँ विकसित करने में मदद कर सकते हैं।", cta: true },
      Severe: { text: "गंभीर चिंता के लक्षण मिले। उचित समर्थन के लिए कृपया किसी मानसिक स्वास्थ्य पेशेवर से जुड़ें।", cta: true },
    },
    gu: {
      Minimal: { text: "Tamara javabo otamati chinta na lakshano suchave chhe. Tamari haali swa-dekhal ni adato jaLvav o.", cta: false },
      Mild: { text: "Halvi chinta na lakshano nodhya. Shasni kasarat ane arama ni paddhati try karo. Counselor pan madad kari shake chhe.", cta: false },
      Moderate: { text: "Madhyam chinta jova mali. Counselor tamane effective coping strategies vikasit karva madad kari shake chhe.", cta: true },
      Severe: { text: "Gambhir chinta na lakshano jova malya. Yogya madad mate krupa kari koi mental health professional sathe judao.", cta: true },
    },
  },
};

const ASSESSMENT_META = {
  PHQ9: {
    key: "PHQ9",
    name: "Depression Screening",
    shortName: "PHQ-9",
    description: "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
    questions: 9,
    minutes: 3,
    icon: Brain,
    color: "#A78BFA",
    maxScore: 27,
    levels: [
      { label: "Minimal", range: "0–4",  color: "#4ADE80", min: 0,  max: 14  },
      { label: "Mild",    range: "5–9",  color: "#FFD93D", min: 15, max: 33  },
      { label: "Moderate",range: "10–14",color: "#FF9F40", min: 34, max: 52  },
      { label: "Moderately Severe", range: "15–19", color: "#F97316", min: 53, max: 70 },
      { label: "Severe",  range: "20–27",color: "#FF6B6B", min: 71, max: 100 },
    ],
    messages: {
      Minimal:  { text: "Your responses suggest minimal depressive symptoms. Keep up healthy habits — exercise, sleep, and social connection go a long way.", cta: false },
      Mild:     { text: "Mild depressive symptoms noted. Explore our Theory sessions and Breathing exercises. Consider speaking to a counsellor if this persists.", cta: false },
      Moderate: { text: "Moderate symptoms detected. Talking to a counsellor can make a significant difference. You don't have to go through this alone.", cta: true },
      "Moderately Severe": { text: "Significant symptoms noted. We recommend connecting with a counsellor soon for support and a care plan.", cta: true },
      Severe:   { text: "Severe symptoms detected. Please reach out to a counsellor or mental health professional as soon as possible.", cta: true },
    },
  },
  GAD7: {
    key: "GAD7",
    name: "Anxiety Screening",
    shortName: "GAD-7",
    description: "Over the last 2 weeks, how often have you been bothered by the following problems?",
    questions: 7,
    minutes: 2,
    icon: HeartPulse,
    color: "#6FFFE9",
    maxScore: 21,
    levels: [
      { label: "Minimal",  range: "0–4",  color: "#4ADE80", min: 0,  max: 19  },
      { label: "Mild",     range: "5–9",  color: "#FFD93D", min: 20, max: 43  },
      { label: "Moderate", range: "10–14",color: "#FF9F40", min: 44, max: 67  },
      { label: "Severe",   range: "15–21",color: "#FF6B6B", min: 68, max: 100 },
    ],
    messages: {
      Minimal:  { text: "Your responses suggest minimal anxiety. Continue with your current self-care routines.", cta: false },
      Mild:     { text: "Mild anxiety symptoms noted. Try breathing exercises and relaxation techniques. A counsellor can also help.", cta: false },
      Moderate: { text: "Moderate anxiety detected. A counsellor can help you develop effective coping strategies.", cta: true },
      Severe:   { text: "Severe anxiety symptoms detected. Please connect with a mental health professional for proper support.", cta: true },
    },
  },
};

function detectAssessmentType(title: string): "PHQ9" | "GAD7" | null {
  if (title.toLowerCase().includes("phq")) return "PHQ9";
  if (title.toLowerCase().includes("gad")) return "GAD7";
  return null;
}

function detectLangFromTitle(title: string): Lang {
  if (title.includes("हिंदी") || title.toLowerCase().includes("hindi")) return "hi";
  if (title.includes("ગુ") || title.toLowerCase().includes("gujarati")) return "gu";
  return "en";
}

function getInterpretation(type: "PHQ9" | "GAD7", scorePercent: number) {
  const meta = ASSESSMENT_META[type];
  for (const lvl of meta.levels) {
    if (scorePercent >= lvl.min && scorePercent <= lvl.max) return lvl;
  }
  return meta.levels[meta.levels.length - 1];
}

export default function AssessmentPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Selection state
  const [selectedLang, setSelectedLang] = useState<Record<string, Lang>>({ PHQ9: "en", GAD7: "en" });

  // Quiz mode
  const [quizMode, setQuizMode] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Questionnaire | null>(null);
  const [activeType, setActiveType] = useState<"PHQ9" | "GAD7" | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [submitting, setSubmitting] = useState(false);

  // Result
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => { fetchQuestionnaires(); }, []);

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

  async function startQuiz(questionnaireId: number, type: "PHQ9" | "GAD7" | null) {
    try {
      setLoading(true);
      setError("");
      const res = await getQuestionnaireApi(questionnaireId);
      setActiveQuiz(res.data);
      setActiveType(type);
      setCurrentIndex(0);
      setAnswers({});
      setQuizMode(true);
      setShowResult(false);
      setScore(null);
    } catch {
      setError("Failed to load assessment");
    } finally {
      setLoading(false);
    }
  }

  function exitQuiz() {
    setQuizMode(false);
    setActiveQuiz(null);
    setActiveType(null);
    setShowResult(false);
    setScore(null);
  }

  const questions = activeQuiz?.questions || [];
  const totalQ = questions.length;
  const currentQ = questions[currentIndex];
  const isLast = currentIndex === totalQ - 1;

  function selectAnswer(value: any) {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: value }));
  }

  function handleNext() {
    if (!currentQ || answers[currentQ.id] === undefined) return;
    if (isLast) handleSubmit();
    else setCurrentIndex((p) => p + 1);
  }

  async function handleSubmit() {
    if (!activeQuiz) return;
    try {
      setSubmitting(true);
      const answerArray = Object.entries(answers).map(([qId, ans]) => ({
        questionId: Number(qId),
        answer: ans,
      }));
      const res = await submitAssessmentApi({ questionnaireId: activeQuiz.id, answers: answerArray });
      setScore(res.data?.score ?? 0);
      setShowResult(true);
    } catch {
      setError("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  // --- RESULT SCREEN — custom questionnaire (no clinical type) ---
  if (showResult && !activeType) {
    const pct = score ?? 0;
    return (
      <div className="flex flex-col items-center pt-8 pb-12">
        <div className="mb-5 flex h-18 w-18 items-center justify-center rounded-[22px] p-4" style={{ background: "rgba(111,255,233,0.12)" }}>
          <CheckCircle2 size={36} style={{ color: "var(--accent-primary)" }} />
        </div>
        <h1 className="font-heading text-[22px] font-semibold" style={{ color: "var(--text-primary)" }}>Assessment Complete</h1>
        <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>{activeQuiz?.title}</p>
        <div className="glass-card mt-6 w-full max-w-sm p-6 text-center">
          <p className="text-[10px] uppercase tracking-[2px]" style={{ color: "var(--text-muted)" }}>Your Score</p>
          <p className="font-heading mt-2 text-[52px] font-bold leading-none" style={{ color: "var(--accent-primary)" }}>{Math.round(pct)}%</p>
          <div className="mt-4 h-2 w-full rounded-full" style={{ background: "var(--progress-bg)" }}>
            <div className="h-2 rounded-full" style={{ width: `${Math.max(pct, 4)}%`, background: "var(--gradient-cta)" }} />
          </div>
        </div>
        <button onClick={() => { setShowResult(false); setQuizMode(false); setActiveQuiz(null); setScore(null); }} className="cta-button mt-8 w-full max-w-sm">
          Done
        </button>
      </div>
    );
  }

  // --- RESULT SCREEN — clinical questionnaire ---
  if (showResult && activeType) {
    const pct = score ?? 0;
    const meta = ASSESSMENT_META[activeType];
    const interp = getInterpretation(activeType, pct);
    const rawScore = Math.round((pct / 100) * meta.maxScore);
    const resultLang: Lang = ((activeQuiz?.language as Lang) && ["en","hi","gu"].includes(activeQuiz!.language)) ? activeQuiz!.language as Lang : "en";
    const t = UI_T[resultLang];
    const levelLabel = LEVEL_T[interp.label]?.[resultLang] || interp.label;
    const msg = MSG_T[activeType]?.[resultLang]?.[interp.label] || MSG_T[activeType]?.en?.[interp.label];

    return (
      <div className="flex flex-col items-center pt-8 pb-12">
        <div
          className="mb-5 flex h-18 w-18 items-center justify-center rounded-[22px] p-4"
          style={{ background: `${interp.color}18` }}
        >
          <CheckCircle2 size={36} style={{ color: interp.color }} />
        </div>

        <h1 className="font-heading text-[22px] font-semibold" style={{ color: "var(--text-primary)" }}>
          {t.complete}
        </h1>
        <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
          {meta.shortName} · {activeQuiz?.title}
        </p>

        {/* Score card */}
        <div className="glass-card mt-6 w-full max-w-sm p-6 text-center">
          <p className="text-[10px] uppercase tracking-[2px]" style={{ color: "var(--text-muted)" }}>
            {meta.shortName} {t.level}
          </p>
          <p className="font-heading mt-2 text-[44px] font-bold leading-none" style={{ color: interp.color }}>
            {levelLabel}
          </p>
          <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
            {t.score}: {rawScore} / {meta.maxScore} · {t.clinicalRange}: {interp.range}
          </p>

          {/* Progress bar */}
          <div className="mt-4 h-2 w-full rounded-full" style={{ background: "var(--progress-bg)" }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${Math.max(pct, 4)}%`, background: interp.color }}
            />
          </div>

          <div
            className="mt-4 rounded-[12px] p-3 text-left"
            style={{ background: `${interp.color}12`, border: `1px solid ${interp.color}25` }}
          >
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {msg?.text}
            </p>
          </div>
        </div>

        {/* Severity scale */}
        <div className="glass-card mt-4 w-full max-w-sm p-4">
          <p className="mb-3 text-[10px] uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
            {t.severityScale}
          </p>
          <div className="space-y-1.5">
            {meta.levels.map((lvl) => (
              <div key={lvl.label} className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: lvl.label === interp.label ? lvl.color : "var(--text-muted)", fontWeight: lvl.label === interp.label ? 600 : 400 }}>
                  {LEVEL_T[lvl.label]?.[resultLang] || lvl.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{lvl.range}</span>
                  {lvl.label === interp.label ? (
                    <span className="rounded-full px-2 py-0.5 text-[8px] font-medium" style={{ background: `${lvl.color}20`, color: lvl.color }}>
                      {t.you}
                    </span>
                  ) : (
                    <span className="w-[32px]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {msg?.cta && (
          <a
            href="mailto:hello@snowflakescounselling.com?subject=Counselling%20Enquiry"
            className="cta-button mt-5 w-full max-w-sm flex items-center justify-center gap-2 no-underline"
            style={{ textDecoration: "none" }}
          >
            <Phone size={14} />
            {t.connect}
          </a>
        )}

        <button onClick={exitQuiz} className="mt-4 text-[13px]" style={{ color: "var(--text-muted)" }}>
          {t.back}
        </button>
      </div>
    );
  }

  // --- QUIZ MODE ---
  if (quizMode && activeQuiz && currentQ) {
    let parsedOptions: any = currentQ.options;
    if (typeof parsedOptions === "string") {
      try { parsedOptions = JSON.parse(parsedOptions); } catch { parsedOptions = []; }
    }
    const optionsList: { text: string; score?: number }[] = Array.isArray(parsedOptions)
      ? parsedOptions.map((o: any) => (typeof o === "string" ? { text: o } : o))
      : [];

    const meta = activeType ? ASSESSMENT_META[activeType] : null;

    return (
      <div className="flex flex-col">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <button onClick={exitQuiz} style={{ color: "var(--text-muted)" }}>
            <ArrowLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>
              {meta?.shortName}
            </p>
          </div>
          <p className="text-[12px] font-semibold" style={{ color: "var(--text-muted)" }}>
            {currentIndex + 1}/{totalQ}
          </p>
        </div>

        {/* Segmented progress */}
        <div className="mb-5 flex gap-[3px]">
          {questions.map((_, i) => (
            <div
              key={i}
              className="h-[4px] flex-1 rounded-full transition-all duration-300"
              style={{ background: i <= currentIndex ? (meta?.color || "var(--gradient-cta)") : "var(--progress-bg)" }}
            />
          ))}
        </div>

        {/* Tag */}
        <div className="mb-5 flex items-center justify-between">
          <span className="tag">{meta?.name}</span>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {Math.round(((currentIndex + 1) / totalQ) * 100)}% complete
          </span>
        </div>

        {/* Timeframe reminder */}
        <p className="mb-4 text-[11px]" style={{ color: "var(--text-muted)" }}>
          Over the <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>last 2 weeks</span>, how often have you been bothered by:
        </p>

        {/* Question */}
        <h2 className="font-heading mb-6 text-[20px] font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
          {currentQ.text.replace(/\?$/, "")}
          <span style={{ color: meta?.color || "var(--accent-primary)" }}>?</span>
        </h2>

        {/* Options — displayed as 4 vertical cards */}
        <div className="flex flex-col gap-[8px]">
          {optionsList.map((option, i) => {
            const isSelected = answers[currentQ.id] === option.text;
            return (
              <button
                key={i}
                onClick={() => selectAnswer(option.text)}
                className="flex items-center gap-3 rounded-[16px] p-4 text-left transition-all"
                style={{
                  background: isSelected ? "var(--pill-active-bg)" : "var(--bg-card)",
                  border: `1px solid ${isSelected ? "var(--pill-active-border)" : "var(--border-card)"}`,
                }}
              >
                {/* Radio */}
                <div
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: isSelected ? (meta?.color || "var(--gradient-cta)") : "transparent",
                    border: isSelected ? "none" : "2px solid var(--border-card)",
                  }}
                >
                  {isSelected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="var(--bg-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                <div className="flex flex-1 items-center justify-between">
                  <span className="text-[13px]" style={{ color: isSelected ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: isSelected ? 600 : 400 }}>
                    {option.text}
                  </span>
                  {option.score !== undefined && (
                    <span className="ml-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {option.score}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={answers[currentQ.id] === undefined || submitting}
          className="cta-button mt-8"
          style={{ opacity: answers[currentQ.id] === undefined ? 0.4 : 1 }}
        >
          {submitting ? "Submitting..." : isLast ? "Submit Assessment" : "Next →"}
        </button>
      </div>
    );
  }

  // --- BROWSE MODE ---
  const phq9Qs = questionnaires.filter((q) => detectAssessmentType(q.title) === "PHQ9");
  const gad7Qs = questionnaires.filter((q) => detectAssessmentType(q.title) === "GAD7");
  const otherQs = questionnaires.filter((q) => detectAssessmentType(q.title) === null);

  function getQForLang(list: Questionnaire[], lang: Lang): Questionnaire | null {
    return list.find((q) => (q.language || detectLangFromTitle(q.title)) === lang) || null;
  }

  return (
    <div>
      <h1 className="font-heading text-[22px] font-semibold" style={{ color: "var(--text-primary)" }}>
        Self Assessment
      </h1>
      <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
        Validated clinical tools · Confidential · Takes 2–3 minutes
      </p>

      {loading && (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
        </div>
      )}

      {error && (
        <div className="glass-card mt-6 p-4 text-center">
          <p className="text-[13px]" style={{ color: "#FF6B6B" }}>{error}</p>
          <button onClick={fetchQuestionnaires} className="mt-3 text-[12px] font-medium" style={{ color: "var(--accent-primary)" }}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6 flex flex-col gap-4">
          {(
            [
              { type: "PHQ9" as const, list: phq9Qs },
              { type: "GAD7" as const, list: gad7Qs },
            ] as const
          ).map(({ type, list }) => {
            if (list.length === 0) return null;
            const meta = ASSESSMENT_META[type];
            const Icon = meta.icon;
            const lang = selectedLang[type] as Lang;
            const chosen = getQForLang(list, lang);

            return (
              <div key={type} className="glass-card overflow-hidden" style={{ borderRadius: "20px" }}>
                {/* Card header */}
                <div className="p-5 pb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px]"
                      style={{ background: `${meta.color}18` }}
                    >
                      <Icon size={20} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {meta.shortName} — {meta.name}
                      </p>
                      <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {meta.questions} questions · ~{meta.minutes} min · Max score {meta.maxScore}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {meta.description}
                  </p>

                  {/* Severity scale preview */}
                  <div className="mt-3 flex gap-1">
                    {meta.levels.map((lvl) => (
                      <div
                        key={lvl.label}
                        className="flex-1 rounded-[4px] py-1 text-center text-[7px] font-medium uppercase"
                        style={{ background: `${lvl.color}20`, color: lvl.color }}
                      >
                        {lvl.label.split(" ")[0]}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Language selector */}
                <div className="flex border-t" style={{ borderColor: "var(--border-card)" }}>
                  {(["en", "hi", "gu"] as Lang[]).map((l) => {
                    const hasLang = list.some((q) => (q.language || detectLangFromTitle(q.title)) === l);
                    return (
                      <button
                        key={l}
                        onClick={() => hasLang && setSelectedLang((prev) => ({ ...prev, [type]: l }))}
                        disabled={!hasLang}
                        className="flex-1 py-2.5 text-[11px] font-medium transition-all"
                        style={
                          lang === l
                            ? { background: `${meta.color}15`, color: meta.color, borderBottom: `2px solid ${meta.color}` }
                            : { color: "var(--text-muted)", opacity: hasLang ? 1 : 0.3 }
                        }
                      >
                        {LANG_LABELS[l]}
                      </button>
                    );
                  })}
                </div>

                {/* Start button */}
                <div className="p-4 pt-3">
                  <button
                    onClick={() => chosen && startQuiz(chosen.id, type)}
                    disabled={!chosen}
                    className="w-full rounded-[14px] py-3 text-[13px] font-semibold transition-all"
                    style={{
                      background: chosen ? `${meta.color}` : "var(--input-bg)",
                      color: chosen ? "var(--bg-primary)" : "var(--text-muted)",
                    }}
                  >
                    Start in {LANG_LABELS[lang]}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Other / custom questionnaires */}
          {otherQs.length > 0 && (
            <>
              <p className="mt-2 px-1 text-[10px] font-normal uppercase tracking-[1.5px]" style={{ color: "var(--text-muted)" }}>
                Other Assessments
              </p>
              {otherQs.map((q) => (
                <div key={q.id} className="glass-card overflow-hidden" style={{ borderRadius: "20px" }}>
                  <div className="flex items-center gap-4 p-5">
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px]"
                      style={{ background: "rgba(167,139,250,0.15)" }}
                    >
                      <ClipboardList size={20} style={{ color: "#A78BFA" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {q.title}
                      </p>
                      <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {q.questionIds?.length ?? "?"} questions · ~{Math.ceil((q.questionIds?.length ?? 5) / 3)} min
                      </p>
                    </div>
                  </div>
                  <div className="px-5 pb-4">
                    <button
                      onClick={() => startQuiz(q.id, null)}
                      className="w-full rounded-[14px] py-3 text-[13px] font-semibold transition-all"
                      style={{ background: "#A78BFA", color: "var(--bg-primary)" }}
                    >
                      Start Assessment
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {phq9Qs.length === 0 && gad7Qs.length === 0 && otherQs.length === 0 && (
            <div className="mt-12 flex flex-col items-center">
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>No assessments available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
