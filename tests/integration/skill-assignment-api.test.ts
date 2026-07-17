/**
 * 场景归属 API 集成测试，证明原子更新、冲突保护与非授权表快照不变。
 * 作者：NDP Coding
 * 日期：2026-07-17 12:05:00
 */
import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { chmodSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createApp } from "@/server/app";
import { createSkillsDatabase } from "../fixtures/create-skills-db";

let directory = "";
let databasePath = "";
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "skills-assignment-"));
  databasePath = join(directory, "assignment.db");
  createSkillsDatabase(databasePath);
});
afterEach(() => rmSync(directory, { recursive: true }));

function snapshot() {
  const db = new Database(databasePath, { readonly: true });
  const result = {
    skills: db.query("SELECT * FROM skills ORDER BY id").all(),
    scenarios: db.query("SELECT * FROM scenarios ORDER BY id").all(),
  };
  db.close();
  return JSON.stringify(result);
}
async function assign(body: unknown) {
  const response = await createApp(databasePath).request(
    "/api/v1/skills/skill-api/scenarios",
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return { response, body: (await response.json()) as any };
}

describe("PUT /api/v1/skills/{skillId}/scenarios", () => {
  test("在即时事务中同时增删且只改变关联表", async () => {
    const before = snapshot();
    const result = await assign({
      expectedScenarioIds: ["scenario-dev", "scenario-plan"],
      scenarioIds: ["scenario-review"],
    });
    expect(result.response.status).toBe(200);
    expect(result.body.data).toMatchObject({
      addedScenarioIds: ["scenario-review"],
      removedScenarioIds: ["scenario-dev", "scenario-plan"],
    });
    expect(snapshot()).toBe(before);
  });
  test("expected 不一致时整体不写入", async () => {
    const before = snapshot();
    const result = await assign({
      expectedScenarioIds: [],
      scenarioIds: ["scenario-review"],
    });
    expect(result.response.status).toBe(409);
    expect(result.body.error.code).toBe("ASSIGNMENT_CONFLICT");
    expect(snapshot()).toBe(before);
  });
  test("目标场景不存在时回滚", async () => {
    const result = await assign({
      expectedScenarioIds: ["scenario-dev", "scenario-plan"],
      scenarioIds: ["missing"],
    });
    expect(result.response.status).toBe(404);
    expect(result.body.error.code).toBe("SCENARIO_NOT_FOUND");
  });

  test("数据库被独占锁定时返回 DATABASE_LOCKED", async () => {
    const locker = new Database(databasePath);
    locker.exec("BEGIN EXCLUSIVE");
    try {
      const result = await assign({
        expectedScenarioIds: ["scenario-dev", "scenario-plan"],
        scenarioIds: ["scenario-review"],
      });
      expect(result.response.status).toBe(409);
      expect(result.body.error.code).toBe("DATABASE_LOCKED");
    } finally {
      locker.exec("ROLLBACK");
      locker.close();
    }
  });

  test("只读数据库拒绝归属写入", async () => {
    chmodSync(databasePath, 0o444);
    chmodSync(directory, 0o555);
    try {
      const result = await assign({
        expectedScenarioIds: ["scenario-dev", "scenario-plan"],
        scenarioIds: ["scenario-review"],
      });
      expect(result.response.status).toBe(503);
      expect(result.body.error.code).toBe("DATABASE_READ_ONLY");
    } finally {
      chmodSync(directory, 0o755);
      chmodSync(databasePath, 0o644);
    }
  });
});
