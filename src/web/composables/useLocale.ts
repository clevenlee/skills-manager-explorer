/**
 * 跨页面共享的 locale 状态：暴露 locale / setLocale。
 * 解析顺序：localStorage → navigator.languages → DEFAULT_LOCALE。
 * 切换语言时同步 document.documentElement.lang 与 localStorage，不触碰路由状态。
 * 作者：NDP Coding
 * 日期：2026-07-18 09:30:00
 */
import { useI18n } from "vue-i18n";

import { i18n } from "../i18n";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "../i18n";

const STORAGE_KEY = "skillsManagerExplorer.locale";

function isSupportedLocale(
  value: string | null | undefined,
): value is SupportedLocale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

/** 从 localStorage / navigator.languages / fallback 解析初始 locale。 */
function resolveInitialLocale(): SupportedLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isSupportedLocale(stored)) return stored;
  } catch {
    // localStorage 可能因隐私模式被禁用，回退到 navigator.languages。
  }
  const languages = window.navigator.languages ?? [window.navigator.language];
  for (const language of languages) {
    const lower = language.toLowerCase();
    if (lower.startsWith("zh")) return "zh-CN";
    if (lower.startsWith("en")) return "en-US";
  }
  return DEFAULT_LOCALE;
}

/** 把 locale 写入 <html lang> 与 i18n.global.locale。 */
function applyLocale(locale: SupportedLocale): void {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
  // 直接更新 vue-i18n 实例的全局 locale ref；这是所有 `useI18n()` 调用读到的同一份 ref。
  // `legacy: false` 下 `i18n.global.locale.value` 形如 `ComputedRef<Locale>`，
  // 实际为可写的 `Ref<string>`（vue-i18n v9），赋值即生效。
  (i18n.global.locale as unknown as { value: string }).value = locale;
}

let initialized = false;

/** 在应用启动时调用一次，解析并应用初始 locale。 */
export function initLocale(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  const locale = resolveInitialLocale();
  applyLocale(locale);
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // 忽略：localStorage 不可用时不阻塞首屏。
  }
}

export function useLocale() {
  const { locale, t } = useI18n();

  function setLocale(next: SupportedLocale): void {
    if (!isSupportedLocale(next)) return;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // 忽略：localStorage 不可用时仍保留内存中的切换。
      }
    }
    applyLocale(next);
    locale.value = next;
  }

  /** 按当前 locale 渲染日期时间；value 为空时返回占位符。 */
  function formatDateTime(
    value: number | null | undefined,
    options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  ): string {
    if (value === null || value === undefined) return t("common.placeholder");
    return new Intl.DateTimeFormat(locale.value, options).format(
      new Date(value),
    );
  }

  /** 按当前 locale 渲染数字（千分位等）。 */
  function formatNumber(value: number): string {
    return new Intl.NumberFormat(locale.value).format(value);
  }

  /** 按当前 locale 比较两个字符串，供客户端兜底排序。 */
  function compareStrings(a: string, b: string): number {
    return a.localeCompare(b, locale.value, { sensitivity: "base" });
  }

  return {
    locale: locale as unknown as { value: SupportedLocale },
    supported: SUPPORTED_LOCALES,
    defaultLocale: DEFAULT_LOCALE,
    setLocale,
    formatDateTime,
    formatNumber,
    compareStrings,
    t,
  };
}
