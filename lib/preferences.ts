/**
 * User preferences persisted to localStorage.
 * Server-side rendering safe — all access guarded by `typeof window !== "undefined"`.
 */

export const LANG_STORAGE_KEY = "ambrin.lang";

export type Lang = "en" | "hi" | "gu";

const VALID_LANGS: Lang[] = ["en", "hi", "gu"];

export function getLanguage(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY) as Lang | null;
  return stored && VALID_LANGS.includes(stored) ? stored : "en";
}

export function setLanguage(lang: string): void {
  if (typeof window === "undefined") return;
  if (!VALID_LANGS.includes(lang as Lang)) return;
  window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  window.dispatchEvent(new CustomEvent("ambrin:lang-change", { detail: { lang } }));
}
