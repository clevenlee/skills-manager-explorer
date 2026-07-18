/**
 * 批量添加场景归属集成测试，证明只追加不替换，并禁止工作区、当前场景等额外副作用。
 * 作者：NDP Coding
 * 日期：2026-07-18 09:30:00
 */
import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createApp } from "@/server/app";
import { createSkillsDatabase } from "../fixtures/create-skills-db";

let directory = "";
let databasePath = "";
let metadataPath = "";
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "skills-bulk-"));
  databasePath = join(directory, "bulk.db");
  metadataPath = join(directory, "skills", ".skills-manager");
  createSkillsDatabase(databasePath);
  mkdirSync(join(metadataPath, "skills"), { recursive: true });
  mkdirSync(join(metadataPath, "scenarios"), { recursive: true });
  mkdirSync(join(metadataPath, "scenario-skills"), { recursive: true });
  writeFileSync(
    join(metadataPath, "schema.json"),
    JSON.stringify({
      schema_version: 1,
      app_min_version: "2.0.0",
      created_by: "skills-manager",
    }),
  );
});
afterEach(() => rmSync(directory, { recursive: true }));

function snapshot() {
  const db = new Database(databasePath, { readonly: true });
  const result = {
    skills: db.query("SELECT * FROM skills ORDER BY id").all(),
    scenarios: db.query("SELECT * FROM scenarios ORDER BY id").all(),
    links: db
      .query(
        "SELECT scenario_id, skill_id FROM scenario_skills ORDER BY scenario_id, skill_id",
      )
      .all(),
    activeScenario: db
      .query("SELECT * FROM active_scenario ORDER BY key")
      .all(),
    settings: db.query("SELECT * FROM settings ORDER BY key").all(),
    targets: db.query("SELECT * FROM skill_targets ORDER BY id").all(),
    projects: db.query("SELECT * FROM projects ORDER BY id").all(),
    auditLog: db.query("SELECT * FROM audit_log ORDER BY id").all(),
  };
  db.close();
  return JSON.stringify(result);
}
async function bulkAdd(body: unknown) {
  const response = await createApp(databasePath).request(
    "/api/v1/skills/bulk-add-scenarios",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return { response, body: (await response.json()) as any };
}

describe("POST /api/v1/skills/bulk-add-scenarios", () => {
  test("提交关联后保存归属，但明确禁用所有已知工作区", async () => {
    const before = JSON.parse(snapshot());
    const { response } = await bulkAdd({
      skillIds: ["skill-api"],
      scenarioIds: ["scenario-review"],
    });

    expect(response.status).toBe(200);
    const membershipPath = join(
      metadataPath,
      "scenario-skills",
      "scenario-review",
      "skill-api.json",
    );
    expect(existsSync(membershipPath)).toBeTrue();
    expect(JSON.parse(readFileSync(membershipPath, "utf8"))).toMatchObject({
      schema_version: 1,
      scenario_id: "scenario-review",
      skill_id: "skill-api",
      tools: {
        claude_code: false,
        codex: false,
        cursor: false,
        team_agent: false,
      },
    });

    const database = new Database(databasePath, { readonly: true });
    expect(
      database
        .query(
          "SELECT tool, enabled FROM scenario_skill_tools WHERE scenario_id = ? AND skill_id = ? ORDER BY tool",
        )
        .all("scenario-review", "skill-api"),
    ).toEqual([
      { tool: "claude_code", enabled: 0 },
      { tool: "codex", enabled: 0 },
      { tool: "cursor", enabled: 0 },
      { tool: "team_agent", enabled: 0 },
    ]);
    database.close();

    const after = JSON.parse(snapshot());
    expect(after.activeScenario).toEqual(before.activeScenario);
    expect(after.settings).toEqual(before.settings);
    expect(after.targets).toEqual(before.targets);
    expect(after.projects).toEqual(before.projects);
    expect(after.auditLog).toEqual(before.auditLog);
  });

  test("元数据无法落盘时回滚全部数据库关联", async () => {
    writeFileSync(
      join(metadataPath, "scenario-skills", "scenario-review"),
      "blocked",
    );

    const { response, body } = await bulkAdd({
      skillIds: ["skill-api"],
      scenarioIds: ["scenario-review"],
    });

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("METADATA_WRITE_FAILED");
    const database = new Database(databasePath, { readonly: true });
    const link = database
      .query(
        "SELECT 1 FROM scenario_skills WHERE scenario_id = ? AND skill_id = ?",
      )
      .get("scenario-review", "skill-api");
    database.close();
    expect(link).toBeNull();
  });

  test("只追加新关联，已存在场景不会被覆盖", async () => {
    const before = snapshot();
    const { response, body } = await bulkAdd({
      skillIds: ["skill-api"],
      scenarioIds: ["scenario-review"],
    });
    expect(response.status).toBe(200);
    expect(body.data.results).toHaveLength(1);
    expect(body.data.results[0]).toMatchObject({
      skillId: "skill-api",
      addedScenarioIds: ["scenario-review"],
    });
    const newSnapshot = JSON.parse(snapshot());
    const newLinks = newSnapshot.links as {
      scenario_id: string;
      skill_id: string;
    }[];
    // skill-api 原已关联 dev / plan，本次仅追加 review。
    expect(newLinks).toEqual(
      expect.arrayContaining([
        { scenario_id: "scenario-dev", skill_id: "skill-api" },
        { scenario_id: "scenario-plan", skill_id: "skill-api" },
        { scenario_id: "scenario-review", skill_id: "skill-api" },
      ]),
    );
    // skills / scenarios 表内容未变。
    const beforeSnapshot = JSON.parse(before);
    expect(newSnapshot.skills).toEqual(beforeSnapshot.skills);
    expect(newSnapshot.scenarios).toEqual(beforeSnapshot.scenarios);
  });

  test("Skill 全部已包含目标场景时进入 skipped", async () => {
    const { response, body } = await bulkAdd({
      skillIds: ["skill-api"],
      scenarioIds: ["scenario-dev"],
    });
    expect(response.status).toBe(200);
    expect(body.data.results).toEqual([]);
    expect(body.data.skipped).toHaveLength(1);
    expect(body.data.skipped[0].skillId).toBe("skill-api");
  });

  test("Skill 不存在时整体拒绝（404）", async () => {
    const { response, body } = await bulkAdd({
      skillIds: ["skill-api", "ghost"],
      scenarioIds: ["scenario-review"],
    });
    expect(response.status).toBe(404);
    expect(body.error.code).toBe("SKILL_NOT_FOUND");
  });

  test("场景不存在时整体拒绝（404）", async () => {
    const { response, body } = await bulkAdd({
      skillIds: ["skill-api"],
      scenarioIds: ["ghost-scenario"],
    });
    expect(response.status).toBe(404);
    expect(body.error.code).toBe("SCENARIO_NOT_FOUND");
  });

  test("空 skillIds 被契约拒绝（400）", async () => {
    const { response } = await bulkAdd({
      skillIds: [],
      scenarioIds: ["scenario-dev"],
    });
    expect(response.status).toBe(400);
  });
});
