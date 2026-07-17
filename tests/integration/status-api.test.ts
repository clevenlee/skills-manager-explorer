/**
 * 状态 API 集成测试，固定各类数据库结果与敏感路径不出现在响应中的约束。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:40:00
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createApp } from "@/server/app";
import { statusEnvelopeSchema } from "@/shared/contracts/status";
import { createSkillsDatabase } from "../fixtures/create-skills-db";

const directories: string[] = [];
function fixturePath(name: string): string {
  const directory = mkdtempSync(join(tmpdir(), "skills-manager-status-"));
  directories.push(directory);
  return join(directory, name);
}

afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true });
});

describe("GET /api/v1/status", () => {
  test("返回兼容数据库状态并通过共享 Schema", async () => {
    const path = fixturePath("valid.db");
    createSkillsDatabase(path);
    const response = await createApp(path).request("/api/v1/status");
    const body: unknown = await response.json();
    expect(response.status).toBe(200);
    expect(statusEnvelopeSchema.safeParse(body).success).toBeTrue();
    expect(body).toMatchObject({
      data: { database: { state: "ready", label: "valid.db" } },
    });
    expect(JSON.stringify(body)).not.toContain(path);
  });

  test("缺失数据库得到可恢复状态且不会泄露目录", async () => {
    const path = fixturePath("missing.db");
    const response = await createApp(path).request("/api/v1/status");
    const body = (await response.json()) as {
      data: { database: { state: string } };
    };
    expect(body.data.database.state).toBe("missing");
    expect(JSON.stringify(body)).not.toContain(path);
  });
});
