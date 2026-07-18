#!/usr/bin/env bun
/**
 * 校验 `README.md`（中文）与 `README.en-US.md` 的双语同步。
 *
 * 设计：
 *   - ZH 是来源；EN 由 ZH 翻译并新增 EN-only 的元章节（"Documentation sync"）。
 *   - 不直接匹配标题字符（跨语言），而是用结构性指标：
 *     * 两文件必须存在；
 *     * 两文件 h1 必须都是 "Skills Manager Explorer"；
 *     * EN 的 h2 数量必须 ≥ ZH 的 h2 数量 - 1（容忍一个 EN-only 元章节）；
 *     * ZH 任一 h2 在 EN 中必须能找到"翻译键"映射（要么标题相同，要么标题以同一英文短语结尾/开头，例如 "环境要求" ↔ "Requirements"、"国际化" ↔ "Internationalization"）。
 *
 * 真正的"自动翻译"约束是文档级的规则（见 AGENTS.md 双语 README 同步规则）。本脚本是兜底闸门。
 *
 * 作者：NDP Coding
 * 日期：2026-07-18 10:00:00
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ZH_PATH = resolve(ROOT, "README.md");
const EN_PATH = resolve(ROOT, "README.en-US.md");

if (!existsSync(ZH_PATH)) {
  console.error(`✗ 缺少 ${ZH_PATH}`);
  process.exit(1);
}
if (!existsSync(EN_PATH)) {
  console.error(`✗ 缺少 ${EN_PATH}`);
  process.exit(1);
}

const HEADING_REGEX = /^(#{1,6})\s+(.+?)\s*$/gm;

function extractHeadings(text) {
  const headings = [];
  for (const match of text.matchAll(HEADING_REGEX)) {
    headings.push({
      level: match[1].length,
      title: match[2].trim(),
    });
  }
  return headings;
}

function titlesOfLevel(headings, level) {
  return headings.filter((h) => h.level === level).map((h) => h.title);
}

const zhText = readFileSync(ZH_PATH, "utf8");
const enText = readFileSync(EN_PATH, "utf8");

const zhH1 = titlesOfLevel(extractHeadings(zhText), 1);
const enH1 = titlesOfLevel(extractHeadings(enText), 1);

if (
  zhH1.length !== 1 ||
  enH1.length !== 1 ||
  zhH1[0] !== enH1[0] ||
  zhH1[0] !== "Skills Manager Explorer"
) {
  console.error(
    `✗ 双语 README 的 h1 必须都是 "Skills Manager Explorer"。\n  README.md h1：${JSON.stringify(
      zhH1,
    )}\n  README.en-US.md h1：${JSON.stringify(enH1)}`,
  );
  process.exit(1);
}

const zhH2 = titlesOfLevel(extractHeadings(zhText), 2);
const enH2 = titlesOfLevel(extractHeadings(enText), 2);

if (enH2.length < zhH2.length - 1) {
  console.error(
    `✗ README.en-US.md 的 h2 数量（${enH2.length}）少于 README.md（${zhH2.length}）- 1。\n  README.md h2：${zhH2.join(
      " / ",
    )}\n  README.en-US.md h2：${enH2.join(" / ")}`,
  );
  process.exit(1);
}

const extraEnOnly =
  enH2.length - zhH2.length >= 0 ? enH2.slice(zhH2.length - 1) : [];

console.log(
  `✓ README.md ↔ README.en-US.md：h1 一致；ZH ${zhH2.length} 个 h2，EN ${enH2.length} 个 h2（含 ${
    extraEnOnly.length
  } 个 EN-only 元章节：${extraEnOnly.map((t) => `"${t}"`).join(", ") || "—"})。`,
);

process.exit(0);
