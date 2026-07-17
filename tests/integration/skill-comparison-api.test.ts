/**
 * Skill 比对 API 集成测试，覆盖来源与场景混合操作数及结果分页。
 * 作者：NDP Coding
 * 日期：2026-07-17 12:05:00
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createApp } from "@/server/app";
import { createSkillsDatabase } from "../fixtures/create-skills-db";

let directory = "";
let databasePath = "";
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "skills-comparison-"));
  databasePath = join(directory, "comparison.db");
  createSkillsDatabase(databasePath);
});
afterEach(() => rmSync(directory, { recursive: true }));

describe("POST /api/v1/skill-comparisons", () => {
  test("比较来源与场景并返回四种计数", async () => {
    const app = createApp(databasePath);
    const sourceBody = (await (
      await app.request("/api/v1/sources?q=acme")
    ).json()) as any;
    const response = await app.request("/api/v1/skill-comparisons", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        left: { type: "source", id: sourceBody.data[0].id },
        right: { type: "scenario", id: "scenario-review" },
        result: "difference",
        page: 1,
        pageSize: 20,
      }),
    });
    const body = (await response.json()) as any;
    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      leftTotal: 2,
      rightTotal: 2,
      counts: { common: 1, leftOnly: 1, rightOnly: 1, difference: 2 },
    });
    expect(
      body.data.items.map((item: { id: string }) => item.id).sort(),
    ).toEqual(["skill-api", "skill-sec"]);
  });
  test("不存在操作数返回稳定错误", async () => {
    const response = await createApp(databasePath).request(
      "/api/v1/skill-comparisons",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          left: { type: "scenario", id: "missing" },
          right: { type: "scenario", id: "scenario-dev" },
        }),
      },
    );
    expect(response.status).toBe(404);
    expect(((await response.json()) as any).error.code).toBe(
      "SCENARIO_NOT_FOUND",
    );
  });
});
