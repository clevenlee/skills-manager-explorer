/**
 * 集合比较单元测试，覆盖重复、空集、相同集合和左右交换。
 * 作者：NDP Coding
 * 日期：2026-07-17 11:15:00
 */
import { describe, expect, test } from "bun:test";

import { compareSkillSets } from "@/shared/domain/skill-comparison";

describe("compareSkillSets", () => {
  test("计算四种集合并去重", () => {
    expect(compareSkillSets(["a", "a", "b", "c"], ["b", "c", "d"])).toEqual({
      common: ["b", "c"],
      leftOnly: ["a"],
      rightOnly: ["d"],
      difference: ["a", "d"],
    });
  });
  test("支持空集和相同集合", () => {
    expect(compareSkillSets([], [])).toEqual({
      common: [],
      leftOnly: [],
      rightOnly: [],
      difference: [],
    });
    expect(compareSkillSets(["a"], ["a"])).toEqual({
      common: ["a"],
      leftOnly: [],
      rightOnly: [],
      difference: [],
    });
  });
  test("交换左右会交换独有集合", () => {
    const result = compareSkillSets(["a", "b"], ["b", "c"]);
    const swapped = compareSkillSets(["b", "c"], ["a", "b"]);
    expect(swapped.leftOnly).toEqual(result.rightOnly);
    expect(swapped.rightOnly).toEqual(result.leftOnly);
  });
});
