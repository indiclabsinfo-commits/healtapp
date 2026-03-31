"use client";

import { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/shared/admin-topbar";
import {
  listCategoriesApi,
  getLevelsApi,
  getQuestionsApi,
  listQuestionnairesApi,
  createQuestionnaireApi,
  updateQuestionnaireApi,
  deleteQuestionnaireApi,
} from "@/lib/questionnaires";
import {
  ChevronRight,
  ChevronLeft,
  Layers,
  BarChart3,
  HelpCircle,
  ClipboardList,
  Check,
  X,
  Trash2,
  Pencil,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Category {
  id: number;
  name: string;
  description: string | null;
  levels: Level[];
  _count: { levels: number };
}

interface Level {
  id: number;
  name: string;
  order: number;
  _count: { questions: number };
}

interface Question {
  id: number;
  text: string;
  type: "MCQ" | "SCALE" | "YESNO";
  options: any;
  levelId: number;
}

interface Questionnaire {
  id: number;
  title: string;
  categoryId: number;
  levelId: number;
  questionIds: number[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Step config                                                        */
/* ------------------------------------------------------------------ */

const STEPS = [
  { num: 1, label: "Categories", icon: Layers },
  { num: 2, label: "Levels", icon: BarChart3 },
  { num: 3, label: "Questions", icon: HelpCircle },
  { num: 4, label: "Build Quiz", icon: ClipboardList },
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminQuestionnairePage() {
  // Navigation
  const [step, setStep] = useState(1);

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);

  // Selections
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);

  // Build form
  const [buildTitle, setBuildTitle] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set());
  const [buildPublished, setBuildPublished] = useState(false);

  // Edit mode
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  /* ---------------------------------------------------------------- */
  /*  Data fetching                                                    */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    fetchCategories();
    fetchQuestionnaires();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    setError("");
    try {
      const result = await listCategoriesApi();
      setCategories(result.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }

  async function fetchLevels(categoryId: number) {
    setLoading(true);
    setError("");
    try {
      const result = await getLevelsApi(categoryId);
      setLevels(result.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch levels");
    } finally {
      setLoading(false);
    }
  }

  async function fetchQuestions(levelId: number) {
    setLoading(true);
    setError("");
    try {
      const result = await getQuestionsApi(levelId);
      setQuestions(result.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  }

  async function fetchQuestionnaires() {
    try {
      const result = await listQuestionnairesApi({ limit: 50 });
      setQuestionnaires(result.data);
    } catch {
      // silent — non-critical
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Step navigation handlers                                         */
  /* ---------------------------------------------------------------- */

  function handleSelectCategory(cat: Category) {
    setSelectedCategory(cat);
    setSelectedLevel(null);
    setQuestions([]);
    fetchLevels(cat.id);
    setStep(2);
  }

  function handleSelectLevel(lvl: Level) {
    setSelectedLevel(lvl);
    fetchQuestions(lvl.id);
    setStep(3);
  }

  function handleGoToBuild() {
    // Pre-select all questions for convenience
    setSelectedQuestionIds(new Set(questions.map((q) => q.id)));
    setBuildTitle("");
    setBuildPublished(false);
    setEditingQuestionnaire(null);
    setStep(4);
  }

  function handleBack() {
    if (step === 2) {
      setSelectedCategory(null);
      setLevels([]);
      setStep(1);
    } else if (step === 3) {
      setSelectedLevel(null);
      setQuestions([]);
      setStep(2);
    } else if (step === 4) {
      setStep(3);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Build / Save                                                     */
  /* ---------------------------------------------------------------- */

  function toggleQuestion(id: number) {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAllQuestions() {
    if (selectedQuestionIds.size === questions.length) {
      setSelectedQuestionIds(new Set());
    } else {
      setSelectedQuestionIds(new Set(questions.map((q) => q.id)));
    }
  }

  async function handleSaveQuestionnaire() {
    if (!buildTitle.trim()) {
      setError("Please enter a questionnaire title");
      return;
    }
    if (selectedQuestionIds.size === 0) {
      setError("Please select at least one question");
      return;
    }
    if (!selectedCategory || !selectedLevel) return;

    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const payload = {
        title: buildTitle.trim(),
        categoryId: selectedCategory.id,
        levelId: selectedLevel.id,
        questionIds: Array.from(selectedQuestionIds),
        published: buildPublished,
      };

      if (editingQuestionnaire) {
        await updateQuestionnaireApi(editingQuestionnaire.id, payload);
        setSuccessMsg("Questionnaire updated successfully");
      } else {
        await createQuestionnaireApi(payload);
        setSuccessMsg("Questionnaire created successfully");
      }

      fetchQuestionnaires();
      setEditingQuestionnaire(null);
      // Stay on build step to show success, auto-clear after 3s
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save questionnaire");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteQuestionnaire(id: number) {
    if (!confirm("Are you sure you want to delete this questionnaire?")) return;
    try {
      await deleteQuestionnaireApi(id);
      fetchQuestionnaires();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete questionnaire");
    }
  }

  async function handleEditQuestionnaire(q: Questionnaire) {
    // Navigate through the steps to load the right data
    const cat = categories.find((c) => c.id === q.categoryId);
    if (!cat) {
      setError("Category not found for this questionnaire");
      return;
    }

    setSelectedCategory(cat);
    setLoading(true);
    try {
      const levelsResult = await getLevelsApi(cat.id);
      setLevels(levelsResult.data);
      const lvl = levelsResult.data.find((l: Level) => l.id === q.levelId);
      if (!lvl) {
        setError("Level not found for this questionnaire");
        setLoading(false);
        return;
      }
      setSelectedLevel(lvl);

      const questionsResult = await getQuestionsApi(lvl.id);
      setQuestions(questionsResult.data);

      // Populate build form
      setBuildTitle(q.title);
      const qIds = Array.isArray(q.questionIds) ? q.questionIds : [];
      setSelectedQuestionIds(new Set(qIds));
      setBuildPublished(q.published);
      setEditingQuestionnaire(q);
      setStep(4);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load questionnaire data");
    } finally {
      setLoading(false);
    }
  }

  function handleTogglePublish(q: Questionnaire) {
    updateQuestionnaireApi(q.id, { published: !q.published })
      .then(() => fetchQuestionnaires())
      .catch((err: any) => setError(err.response?.data?.error || "Failed to update"));
  }

  /* ---------------------------------------------------------------- */
  /*  Helpers                                                          */
  /* ---------------------------------------------------------------- */

  function getQuestionTypeColor(type: string) {
    switch (type) {
      case "MCQ":
        return { bg: "rgba(111,255,233,0.1)", color: "var(--accent-primary)", border: "rgba(111,255,233,0.15)" };
      case "SCALE":
        return { bg: "rgba(167,139,250,0.1)", color: "#A78BFA", border: "rgba(167,139,250,0.15)" };
      case "YESNO":
        return { bg: "rgba(255,217,61,0.1)", color: "#FFD93D", border: "rgba(255,217,61,0.15)" };
      default:
        return { bg: "rgba(111,255,233,0.1)", color: "var(--accent-primary)", border: "rgba(111,255,233,0.15)" };
    }
  }

  function getTotalQuestions(cat: Category) {
    return cat.levels.reduce((sum, lvl) => sum + (lvl._count?.questions || 0), 0);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div>
      <AdminTopbar title="Questionnaire" subtitle="Build and manage assessments" />

      <div className="p-8">
        {/* ---- Step Indicator ---- */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (
              <div key={s.num} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Only allow going back to completed steps
                    if (s.num < step) {
                      if (s.num === 1) {
                        setStep(1);
                        setSelectedCategory(null);
                        setSelectedLevel(null);
                        setLevels([]);
                        setQuestions([]);
                      } else if (s.num === 2 && selectedCategory) {
                        setStep(2);
                        setSelectedLevel(null);
                        setQuestions([]);
                      } else if (s.num === 3 && selectedLevel) {
                        setStep(3);
                      }
                    }
                  }}
                  className={isActive ? "pill-active" : "pill-inactive"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: s.num <= step ? "pointer" : "default",
                    opacity: s.num > step ? 0.4 : 1,
                  }}
                >
                  {isCompleted ? (
                    <Check size={12} />
                  ) : (
                    <Icon size={12} />
                  )}
                  <span>{s.label}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <ChevronRight size={14} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ---- Error ---- */}
        {error && (
          <div className="mb-4 rounded-card p-3 text-[12px]" style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
            {error}
            <button
              onClick={() => setError("")}
              className="ml-2 font-medium underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ---- Success ---- */}
        {successMsg && (
          <div
            className="mb-4 rounded-card p-3 text-[12px]"
            style={{ background: "rgba(74,222,128,0.1)", color: "#4ADE80" }}
          >
            {successMsg}
          </div>
        )}

        {/* ---- Loading ---- */}
        {loading && (
          <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            Loading...
          </div>
        )}

        {/* ================================================================ */}
        {/*  STEP 1: Categories                                               */}
        {/* ================================================================ */}
        {!loading && step === 1 && (
          <div>
            <h2
              className="font-heading mb-4 text-[18px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Select a Category
            </h2>
            <p className="mb-6 text-[12px]" style={{ color: "var(--text-muted)" }}>
              Choose a category to browse its levels and questions.
            </p>

            {categories.length === 0 && (
              <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                No categories found. Create categories first.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat)}
                  className="glass-card p-5 text-left transition-all hover:scale-[1.01]"
                  style={{ borderRadius: "20px" }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]"
                      style={{ background: "rgba(111,255,233,0.1)" }}
                    >
                      <Layers size={18} style={{ color: "var(--accent-primary)" }} />
                    </div>
                    <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                  </div>

                  <h3
                    className="mt-3 text-[14px] font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p
                      className="mt-1 line-clamp-2 text-[11px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {cat.description}
                    </p>
                  )}

                  <div
                    className="mt-3 flex gap-4 pt-3 text-[10px] uppercase tracking-[1.5px]"
                    style={{ borderTop: "1px solid var(--border-card)", color: "var(--text-muted)" }}
                  >
                    <span>{cat._count.levels} level{cat._count.levels !== 1 ? "s" : ""}</span>
                    <span>{getTotalQuestions(cat)} question{getTotalQuestions(cat) !== 1 ? "s" : ""}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/*  STEP 2: Levels                                                   */}
        {/* ================================================================ */}
        {!loading && step === 2 && selectedCategory && (
          <div>
            <button
              onClick={handleBack}
              className="mb-4 flex items-center gap-1 text-[12px] font-medium"
              style={{ color: "var(--accent-primary)" }}
            >
              <ChevronLeft size={14} /> Back to Categories
            </button>

            <h2
              className="font-heading mb-1 text-[18px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {selectedCategory.name}
            </h2>
            <p className="mb-6 text-[12px]" style={{ color: "var(--text-muted)" }}>
              Select a level to view its questions.
            </p>

            {levels.length === 0 && (
              <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                No levels found in this category.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {levels.map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => handleSelectLevel(lvl)}
                  className="glass-card p-5 text-left transition-all hover:scale-[1.01]"
                  style={{ borderRadius: "20px" }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]"
                      style={{ background: "rgba(167,139,250,0.1)" }}
                    >
                      <BarChart3 size={18} style={{ color: "#A78BFA" }} />
                    </div>
                    <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                  </div>

                  <h3
                    className="mt-3 text-[14px] font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {lvl.name}
                  </h3>

                  <div
                    className="mt-3 flex gap-4 pt-3 text-[10px] uppercase tracking-[1.5px]"
                    style={{ borderTop: "1px solid var(--border-card)", color: "var(--text-muted)" }}
                  >
                    <span>Order: {lvl.order}</span>
                    <span>{lvl._count.questions} question{lvl._count.questions !== 1 ? "s" : ""}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/*  STEP 3: Questions                                                */}
        {/* ================================================================ */}
        {!loading && step === 3 && selectedCategory && selectedLevel && (
          <div>
            <button
              onClick={handleBack}
              className="mb-4 flex items-center gap-1 text-[12px] font-medium"
              style={{ color: "var(--accent-primary)" }}
            >
              <ChevronLeft size={14} /> Back to Levels
            </button>

            <div className="mb-1 flex items-center gap-2">
              <h2
                className="font-heading text-[18px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {selectedLevel.name}
              </h2>
              <span className="tag">{selectedCategory.name}</span>
            </div>
            <p className="mb-6 text-[12px]" style={{ color: "var(--text-muted)" }}>
              {questions.length} question{questions.length !== 1 ? "s" : ""} in this level.
            </p>

            {questions.length === 0 && (
              <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                No questions found in this level.
              </div>
            )}

            <div className="space-y-3">
              {questions.map((q, idx) => {
                const typeStyle = getQuestionTypeColor(q.type);
                return (
                  <div
                    key={q.id}
                    className="glass-card p-4"
                    style={{ borderRadius: "16px" }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[8px] text-[10px] font-bold"
                        style={{ background: "rgba(111,255,233,0.1)", color: "var(--accent-primary)" }}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[13px] font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {q.text}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className="inline-block rounded-pill px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide"
                            style={{
                              background: typeStyle.bg,
                              color: typeStyle.color,
                              border: `1px solid ${typeStyle.border}`,
                            }}
                          >
                            {q.type}
                          </span>
                          {q.type === "MCQ" && Array.isArray(q.options) && (
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                              {q.options.length} option{q.options.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          {q.type === "SCALE" && q.options && (
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                              Scale: {q.options.min ?? 1} - {q.options.max ?? 10}
                            </span>
                          )}
                        </div>

                        {/* Show MCQ options preview */}
                        {q.type === "MCQ" && Array.isArray(q.options) && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {q.options.map((opt: any, oIdx: number) => {
                              const optText = typeof opt === "string" ? opt : opt.text || opt.label || String(opt);
                              return (
                                <span
                                  key={oIdx}
                                  className="rounded-pill px-2 py-0.5 text-[9px]"
                                  style={{
                                    background: "var(--input-bg)",
                                    border: "1px solid var(--input-border)",
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  {optText}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Build Quiz button */}
            {questions.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={handleGoToBuild}
                  className="cta-button flex items-center justify-center gap-2"
                  style={{ maxWidth: "300px" }}
                >
                  <ClipboardList size={16} />
                  Build Questionnaire
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/*  STEP 4: Build Quiz                                               */}
        {/* ================================================================ */}
        {!loading && step === 4 && selectedCategory && selectedLevel && (
          <div>
            <button
              onClick={handleBack}
              className="mb-4 flex items-center gap-1 text-[12px] font-medium"
              style={{ color: "var(--accent-primary)" }}
            >
              <ChevronLeft size={14} /> Back to Questions
            </button>

            <h2
              className="font-heading mb-1 text-[18px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {editingQuestionnaire ? "Edit Questionnaire" : "Build Questionnaire"}
            </h2>
            <p className="mb-6 text-[12px]" style={{ color: "var(--text-muted)" }}>
              Configure and save your questionnaire.
            </p>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
              {/* Left: Form + Question checklist */}
              <div className="space-y-5">
                {/* Title */}
                <div className="glass-card p-5" style={{ borderRadius: "20px" }}>
                  <label
                    className="mb-2 block text-[10px] uppercase tracking-[1.5px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Questionnaire Title
                  </label>
                  <input
                    type="text"
                    value={buildTitle}
                    onChange={(e) => setBuildTitle(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Anxiety Assessment - Level 1"
                  />
                </div>

                {/* Question checklist */}
                <div className="glass-card p-5" style={{ borderRadius: "20px" }}>
                  <div className="mb-4 flex items-center justify-between">
                    <label
                      className="text-[10px] uppercase tracking-[1.5px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Select Questions ({selectedQuestionIds.size}/{questions.length})
                    </label>
                    <button
                      onClick={toggleAllQuestions}
                      className="text-[11px] font-medium"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      {selectedQuestionIds.size === questions.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {questions.map((q, idx) => {
                      const isChecked = selectedQuestionIds.has(q.id);
                      const typeStyle = getQuestionTypeColor(q.type);
                      return (
                        <button
                          key={q.id}
                          onClick={() => toggleQuestion(q.id)}
                          className="flex w-full items-start gap-3 rounded-[12px] p-3 text-left transition-all"
                          style={{
                            background: isChecked ? "rgba(111,255,233,0.06)" : "var(--input-bg)",
                            border: `1px solid ${isChecked ? "rgba(111,255,233,0.2)" : "var(--input-border)"}`,
                          }}
                        >
                          {/* Checkbox */}
                          <div
                            className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[6px]"
                            style={{
                              background: isChecked ? "var(--gradient-cta)" : "transparent",
                              border: isChecked ? "none" : "1.5px solid var(--input-border)",
                            }}
                          >
                            {isChecked && <Check size={12} style={{ color: "#0B0C10" }} />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p
                              className="text-[12px] font-medium"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {idx + 1}. {q.text}
                            </p>
                            <span
                              className="mt-1 inline-block rounded-pill px-2 py-0.5 text-[8px] font-medium uppercase tracking-wide"
                              style={{
                                background: typeStyle.bg,
                                color: typeStyle.color,
                                border: `1px solid ${typeStyle.border}`,
                              }}
                            >
                              {q.type}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {questions.length === 0 && (
                    <p className="py-4 text-center text-[12px]" style={{ color: "var(--text-muted)" }}>
                      No questions available in this level.
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Summary sidebar */}
              <div className="space-y-5">
                {/* Category + Level info */}
                <div className="glass-card p-5" style={{ borderRadius: "20px" }}>
                  <label
                    className="mb-3 block text-[10px] uppercase tracking-[1.5px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Quiz Details
                  </label>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        Category
                      </span>
                      <span className="tag">{selectedCategory.name}</span>
                    </div>
                    <div
                      className="flex items-center justify-between pt-3"
                      style={{ borderTop: "1px solid var(--border-card)" }}
                    >
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        Level
                      </span>
                      <span className="tag">{selectedLevel.name}</span>
                    </div>
                    <div
                      className="flex items-center justify-between pt-3"
                      style={{ borderTop: "1px solid var(--border-card)" }}
                    >
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        Questions
                      </span>
                      <span
                        className="text-[14px] font-bold"
                        style={{ color: "var(--accent-primary)" }}
                      >
                        {selectedQuestionIds.size}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Publish toggle */}
                <div className="glass-card p-5" style={{ borderRadius: "20px" }}>
                  <label
                    className="mb-3 block text-[10px] uppercase tracking-[1.5px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Publish Settings
                  </label>
                  <button
                    onClick={() => setBuildPublished((p) => !p)}
                    className="flex w-full items-center justify-between rounded-[12px] p-3"
                    style={{
                      background: "var(--input-bg)",
                      border: "1px solid var(--input-border)",
                    }}
                  >
                    <div>
                      <p
                        className="text-[13px] font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {buildPublished ? "Published" : "Draft"}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {buildPublished
                          ? "Visible to users for assessments"
                          : "Only visible to admins"}
                      </p>
                    </div>
                    <div
                      className="flex h-6 w-11 items-center rounded-full px-0.5 transition-all"
                      style={{
                        background: buildPublished
                          ? "var(--gradient-cta)"
                          : "var(--input-border)",
                      }}
                    >
                      <div
                        className="h-5 w-5 rounded-full transition-all"
                        style={{
                          background: buildPublished ? "#0B0C10" : "var(--text-muted)",
                          transform: buildPublished ? "translateX(20px)" : "translateX(0px)",
                        }}
                      />
                    </div>
                  </button>
                </div>

                {/* Save button */}
                <button
                  onClick={handleSaveQuestionnaire}
                  disabled={saving}
                  className="cta-button w-full"
                >
                  {saving
                    ? "Saving..."
                    : editingQuestionnaire
                    ? "Update Questionnaire"
                    : "Save Questionnaire"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/*  Existing Questionnaires List                                     */}
        {/* ================================================================ */}
        <div className="mt-12">
          <div
            className="mb-4 pt-8"
            style={{ borderTop: "1px solid var(--border-card)" }}
          >
            <h2
              className="font-heading text-[18px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Existing Questionnaires
            </h2>
            <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
              {questionnaires.length} questionnaire{questionnaires.length !== 1 ? "s" : ""} created
            </p>
          </div>

          {questionnaires.length === 0 && (
            <div className="py-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
              No questionnaires created yet. Use the builder above to create one.
            </div>
          )}

          <div className="space-y-3">
            {questionnaires.map((q) => {
              const cat = categories.find((c) => c.id === q.categoryId);
              const qIds = Array.isArray(q.questionIds) ? q.questionIds : [];
              return (
                <div
                  key={q.id}
                  className="glass-card flex flex-wrap items-center gap-4 p-5"
                  style={{ borderRadius: "16px" }}
                >
                  {/* Icon */}
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]"
                    style={{ background: "rgba(111,255,233,0.1)" }}
                  >
                    <ClipboardList size={18} style={{ color: "var(--accent-primary)" }} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[14px] font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {q.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {cat && <span className="tag">{cat.name}</span>}
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {qIds.length} question{qIds.length !== 1 ? "s" : ""}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        Created {formatDate(q.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <span
                    className="inline-block rounded-pill px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide"
                    style={{
                      background: q.published ? "rgba(74,222,128,0.1)" : "rgba(255,217,61,0.1)",
                      color: q.published ? "#4ADE80" : "#FFD93D",
                      border: `1px solid ${q.published ? "rgba(74,222,128,0.15)" : "rgba(255,217,61,0.15)"}`,
                    }}
                  >
                    {q.published ? "Published" : "Draft"}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePublish(q)}
                      className="rounded-icon p-1.5"
                      style={{ color: q.published ? "#FFD93D" : "#4ADE80" }}
                      title={q.published ? "Unpublish" : "Publish"}
                    >
                      {q.published ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <button
                      onClick={() => handleEditQuestionnaire(q)}
                      className="rounded-icon p-1.5"
                      style={{ color: "var(--accent-primary)" }}
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestionnaire(q.id)}
                      className="rounded-icon p-1.5"
                      style={{ color: "#FF6B6B" }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
