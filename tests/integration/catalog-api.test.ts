/**
 * 目录 API 集成测试，覆盖概览、来源、场景、Skill 组合筛选、分页与详情错误。
 * 作者：NDP Coding
 * 日期：2026-07-17 12:05:00
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createApp } from "@/server/app";
import { createSkillsDatabase } from "../fixtures/create-skills-db";

let directory = "";
let databasePath = "";
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "skills-catalog-"));
  databasePath = join(directory, "catalog.db");
  createSkillsDatabase(databasePath);
});
afterEach(() => rmSync(directory, { recursive: true }));

async function get(path: string) {
  const response = await createApp(databasePath).request(path);
  return { response, body: (await response.json()) as Record<string, any> };
}

describe("只读目录 API", () => {
  test("概览指标与 fixture 一致", async () => {
    const { body } = await get("/api/v1/overview");
    expect(body.data).toEqual({
      skills: 6,
      sources: 5,
      scenarios: 4,
      orphanSkills: 1,
      multiScenarioSkills: 2,
    });
  });
  test("来源按规范标识聚合并支持搜索排序分页", async () => {
    const { body } = await get(
      "/api/v1/sources?q=acme&sort=skillCount&order=desc&pageSize=1",
    );
    expect(body.meta.total).toBe(1);
    expect(body.data[0]).toMatchObject({
      name: "acme/skills",
      skillCount: 2,
      assignedSkillCount: 2,
    });
  });
  test("场景按 sort_order 稳定排序且保持只读", async () => {
    const { body } = await get("/api/v1/scenarios");
    expect(body.data.map((item: { id: string }) => item.id)).toEqual([
      "scenario-dev",
      "scenario-review",
      "scenario-plan",
      "scenario-empty",
    ]);
    expect(body.data[0].skillCount).toBe(3);
  });
  test("Skill 支持跨维度且、同维度或与孤立筛选", async () => {
    const sources = (await get("/api/v1/sources?q=acme")).body.data;
    const sourceId = sources[0].id;
    const filtered = (
      await get(
        `/api/v1/skills?sourceIds=${encodeURIComponent(sourceId)}&scenarioIds=scenario-review,scenario-plan`,
      )
    ).body;
    expect(filtered.data.map((item: { id: string }) => item.id).sort()).toEqual(
      ["skill-api", "skill-test"],
    );
    const orphan = (await get("/api/v1/skills?orphan=true")).body;
    expect(orphan.data.map((item: { id: string }) => item.id)).toEqual([
      "skill-orphan",
    ]);
  });
  test("Skill 支持重复归属筛选，且默认不分页", async () => {
    const duplicateAssignments = await get(
      "/api/v1/skills?multiScenario=true&pageSize=0",
    );
    expect(duplicateAssignments.response.status).toBe(200);
    expect(duplicateAssignments.body.meta).toMatchObject({
      page: 1,
      pageSize: 0,
      total: 2,
    });
    expect(
      duplicateAssignments.body.data
        .map((item: { id: string }) => item.id)
        .sort(),
    ).toEqual(["skill-api", "skill-test"]);

    const defaults = await get("/api/v1/skills");
    expect(defaults.body.meta.pageSize).toBe(0);
    expect(defaults.body.data).toHaveLength(defaults.body.meta.total);
  });
  test("Skill 返回创建时间并支持按创建时间升序与倒序排序", async () => {
    const database = new Database(databasePath, { strict: true });
    database.exec(`
      UPDATE skills SET created_at = CASE id
        WHEN 'skill-api' THEN 1
        WHEN 'skill-test' THEN 2
        WHEN 'skill-ui' THEN 3
        WHEN 'skill-sec' THEN 4
        WHEN 'skill-doc' THEN 5
        WHEN 'skill-orphan' THEN 6
      END;
    `);
    database.close();

    const ascending = await get(
      "/api/v1/skills?sort=createdAt&order=asc&pageSize=0",
    );
    expect(ascending.response.status).toBe(200);
    expect(ascending.body.data.map((item: { id: string }) => item.id)).toEqual([
      "skill-api",
      "skill-test",
      "skill-ui",
      "skill-sec",
      "skill-doc",
      "skill-orphan",
    ]);
    expect(ascending.body.data[0].createdAt).toBe(1);

    const descending = await get(
      "/api/v1/skills?sort=createdAt&order=desc&pageSize=0",
    );
    expect(descending.body.data.map((item: { id: string }) => item.id)).toEqual(
      [
        "skill-orphan",
        "skill-doc",
        "skill-sec",
        "skill-ui",
        "skill-test",
        "skill-api",
      ],
    );
  });
  test("详情返回全部字段，不存在返回稳定错误", async () => {
    const detail = await get("/api/v1/skills/skill-api");
    expect(detail.body.data).toMatchObject({
      id: "skill-api",
      sourceBranch: "main",
      contentHash: "hash-skill-api",
    });
    const missing = await get("/api/v1/skills/not-found");
    expect(missing.response.status).toBe(404);
    expect(missing.body.error.code).toBe("SKILL_NOT_FOUND");
  });
});
