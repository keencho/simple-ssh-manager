import { addMessages, init, locale, _ } from "svelte-i18n";
import { get } from "svelte/store";
import { emit, listen } from "@tauri-apps/api/event";
import en from "./en.json";
import ko from "./ko.json";

export type Lang = "en" | "ko";
export type InterpolationValue = string | number | boolean | Date | null | undefined;
export type LangCallback = (lang: Lang) => void;

const STORAGE_KEY = "kc-lang";
const LANG_EVENT = "kc-lang-changed";

addMessages("en", en);
addMessages("ko", ko);

const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
const initialLocale: Lang = stored === "ko" ? "ko" : "en";

init({
  fallbackLocale: "en",
  initialLocale,
});

const callbacks = new Set<LangCallback>();

function applyChange(lang: Lang) {
  if (get(locale) === lang) return false;
  localStorage.setItem(STORAGE_KEY, lang);
  locale.set(lang);
  return true;
}

// Cross-window sync: another window changed the language.
void listen<{ lang: Lang }>(LANG_EVENT, (e) => {
  if (!applyChange(e.payload.lang)) return;
  for (const cb of callbacks) cb(e.payload.lang);
});

export function t(key: string, params?: Record<string, InterpolationValue>): string {
  return get(_)(key, { values: params });
}

export function getLanguage(): Lang {
  return (get(locale) as Lang) ?? "en";
}

export function setLanguage(lang: Lang): void {
  const changed = applyChange(lang);
  if (changed) for (const cb of callbacks) cb(lang);
  void emit(LANG_EVENT, { lang });
}

export function onLanguageChanged(cb: LangCallback): () => void {
  callbacks.add(cb);
  return () => callbacks.delete(cb);
}

export { locale, _ };
