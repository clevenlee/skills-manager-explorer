/**
 * 通用字符串排序工具：使用 `Intl.Collator` 而非 `localeCompare(...,"zh-CN")` 等硬编码 locale。
 *
 * 设计：
 *   - 不传具体 locale 参数，让运行时按系统 / 环境选择；Bun 在服务端默认走
 *     ICU 的 root collation（Unicode CLDR），对仓库名、Skill 名等 ASCII 字符有合理顺序，
 *     同时对 CJK 字符不偏向特定语言。
 *   - `sensitivity: "base"` 忽略大小写与重音；`numeric: true` 让 `name2` 排在 `name10` 之前。
 *   - 主排序仍由 SQL 的 `ORDER BY name COLLATE NOCASE` 提供，本工具只作为结果集在
 *     服务端的兜底 tie-breaker；详见 1.0.2 plan §4 #8。
 *
 * 作者：NDP Coding
 * 日期：2026-07-18 09:30:00
 */
function buildCollator(): Intl.Collator {
  return new Intl.Collator(undefined, {
    sensitivity: "base",
    numeric: true,
    usage: "sort",
  });
}

function compareViaCollator(a: string, b: string): number {
  return buildCollator().compare(a, b);
}

/** 字符串比较：返回负数 / 0 / 正数。 */
export function compareNames(a: string, b: string): number {
  const result: number = compareViaCollator(a, b);
  return result;
}

/** 字符串相等（按上述 collation 的 case/accent-insensitive 语义）。 */
export function namesEqual(a: string, b: string): boolean {
  return compareNames(a, b) === 0;
}
