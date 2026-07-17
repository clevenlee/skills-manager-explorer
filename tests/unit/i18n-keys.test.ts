/**
 * i18n key 完整性测试：确保 zh-CN 定义的每个 key 在 en-US 中都有对应翻译。
 * 编译期已经通过 en-US 的 `satisfies MessageSchema` 拦截漏译；本测试作为运行时兜底，
 * 当 build 配置或 import 路径变化导致 satisfies 失效时仍能在 `bun run verify` 中失败。
 * 作者：NDP Coding
 * 日期：2026-07-18 09:30:00
 */
import { describe, expect, test } from "bun:test";

import { enUS } from "@/web/i18n/locales/en-US";
import { zhCN } from "@/web/i18n/locales/zh-CN";

type Locale = Record<string, unknown>;

function collectKeys(value: Locale, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, child] of Object.entries(value)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (child !== null && typeof child === "object" && !Array.isArray(child)) {
      keys.push(...collectKeys(child as Locale, next));
    } else {
      keys.push(next);
    }
  }
  return keys.sort();
}

const zhKeys = collectKeys(zhCN as unknown as Locale);
const enKeys = collectKeys(enUS as unknown as Locale);

describe("i18n locales", () => {
  test("zh-CN 与 en-US key 集合一致", () => {
    const missingInEn = zhKeys.filter((key) => !enKeys.includes(key));
    const missingInZh = enKeys.filter((key) => !zhKeys.includes(key));
    if (missingInEn.length || missingInZh.length) {
      const lines: string[] = [];
      if (missingInEn.length)
        lines.push(`  en-US 缺失：${missingInEn.join(", ")}`);
      if (missingInZh.length)
        lines.push(`  zh-CN 缺失：${missingInZh.join(", ")}`);
      throw new Error(
        `locale key 集合不一致：\n${lines.join("\n")}\n请在 src/web/i18n/locales/{zh-CN,en-US}.ts 同步补齐。`,
      );
    }
    expect(missingInEn).toEqual([]);
    expect(missingInZh).toEqual([]);
  });

  test("zh-CN / en-US 至少含 50 个叶子 key", () => {
    expect(zhKeys.length).toBeGreaterThanOrEqual(50);
    expect(enKeys.length).toBeGreaterThanOrEqual(50);
  });

  test("叶子值不能为空字符串", () => {
    const flatten = (value: Locale, prefix = ""): [string, unknown][] => {
      const out: [string, unknown][] = [];
      for (const [key, child] of Object.entries(value)) {
        const next = prefix ? `${prefix}.${key}` : key;
        if (
          child !== null &&
          typeof child === "object" &&
          !Array.isArray(child)
        ) {
          out.push(...flatten(child as Locale, next));
        } else {
          out.push([next, child]);
        }
      }
      return out;
    };
    const empties: string[] = [];
    for (const [key, value] of flatten(zhCN as unknown as Locale)) {
      if (typeof value === "string" && value.trim() === "") {
        empties.push(`zh-CN:${key}`);
      }
    }
    for (const [key, value] of flatten(enUS as unknown as Locale)) {
      if (typeof value === "string" && value.trim() === "") {
        empties.push(`en-US:${key}`);
      }
    }
    expect(empties).toEqual([]);
  });
});
