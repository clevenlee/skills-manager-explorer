/**
 * 来源规范化表驱动测试，覆盖 URL 修饰、fallback、本地路径和脱敏企业地址。
 * 作者：NDP Coding
 * 日期：2026-07-17 11:15:00
 */
import { describe, expect, test } from "bun:test";

import { normalizeSource } from "@/server/services/normalize-source";

describe("normalizeSource", () => {
  test.each([
    [
      "https://github.com/acme/skills.git",
      "acme/skills",
      "https://github.com/acme/skills",
    ],
    [
      "https://github.com/acme/skills.git/?ref=main#readme",
      "acme/skills",
      "https://github.com/acme/skills",
    ],
    [
      "https://gitlab.example.com/team/ui-skills.git",
      "team/ui-skills",
      "https://gitlab.example.com/team/ui-skills",
    ],
  ])("规范化 HTTP 来源 %s", (raw, name, externalUrl) => {
    expect(
      normalizeSource({
        sourceType: "git",
        sourceRef: null,
        sourceRefResolved: raw,
      }),
    ).toMatchObject({ name, externalUrl });
  });

  test("resolved 缺失时回退 source_ref 且不裁剪本地路径", () => {
    expect(
      normalizeSource({
        sourceType: "local",
        sourceRef: "/opt/team/security/skill-pack",
        sourceRefResolved: null,
      }),
    ).toMatchObject({
      name: "skill-pack",
      key: "local:/opt/team/security/skill-pack",
      externalUrl: null,
    });
  });

  test("未知来源仍产生稳定标识", () => {
    expect(
      normalizeSource({
        sourceType: null,
        sourceRef: null,
        sourceRefResolved: null,
      }),
    ).toMatchObject({ name: "未知来源", type: "unknown" });
  });
});
