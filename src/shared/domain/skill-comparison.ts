/**
 * Skill 集合比较领域模型，固定共有、左右独有与对称差的数学语义。
 * 作者：NDP Coding
 * 日期：2026-07-17 11:15:00
 */
export type SkillSetComparison = {
  common: string[];
  leftOnly: string[];
  rightOnly: string[];
  difference: string[];
};

export function compareSkillSets(
  leftValues: Iterable<string>,
  rightValues: Iterable<string>,
): SkillSetComparison {
  const left = new Set(leftValues);
  const right = new Set(rightValues);
  const common = [...left].filter((id) => right.has(id)).sort();
  const leftOnly = [...left].filter((id) => !right.has(id)).sort();
  const rightOnly = [...right].filter((id) => !left.has(id)).sort();
  return {
    common,
    leftOnly,
    rightOnly,
    difference: [...leftOnly, ...rightOnly].sort(),
  };
}
