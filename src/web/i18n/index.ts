/**
 * vue-i18n 实例；legacy:false 使用 Composition API；fallbackLocale 与持久化键见 1.0.2 plan §4 #6。
 * 启动时按 useLocale 解析 localStorage / navigator.languages / fallback；切换在 useLocale.setLocale 内统一处理。
 * 作者：NDP Coding
 * 日期：2026-07-18 09:30:00
 */
import { createI18n } from "vue-i18n";

import { initLocale } from "../composables/useLocale";
import { enUS } from "./locales/en-US";
import { zhCN } from "./locales/zh-CN";

export const SUPPORTED_LOCALES = ["zh-CN", "en-US"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "zh-CN";

// dev 环境打开 missing/fallback warn 以便尽早发现漏译；prod 关闭以避免控制台噪声。
const isDev = import.meta.env.DEV;

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    "zh-CN": zhCN,
    "en-US": enUS,
  },
  missingWarn: isDev,
  fallbackWarn: isDev,
});

export { initLocale };
