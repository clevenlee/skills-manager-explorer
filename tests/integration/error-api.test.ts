/**
 * 统一错误 API 测试，覆盖输入、缺失数据库和不兼容结构且禁止泄露路径与堆栈。
 * 作者：NDP Coding
 * 日期：2026-07-17 13:50:00
 */
import { Database } from "bun:sqlite";
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createApp } from "@/server/app";
import { createSkillsDatabase } from "../fixtures/create-skills-db";

const directories: string[] = [];
function pathFor(name: string) {
  const directory = mkdtempSync(join(tmpdir(), "skills-errors-"));
  directories.push(directory);
  return join(directory, name);
}
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true });
});

describe("统一 API 错误", () => {
  test("查询参数错误返回安全的 VALIDATION_ERROR", async () => {
    const path = pathFor("valid.db");
    createSkillsDatabase(path);
    const response = await createApp(path).request("/api/v1/skills?page=0");
    const text = await response.text();
    expect(response.status).toBe(400);
    expect(JSON.parse(text).error.code).toBe("VALIDATION_ERROR");
    expect(text).not.toContain(path);
    expect(text).not.toContain("stack");
  });
  test("缺失数据库返回 DATABASE_UNAVAILABLE", async () => {
    const path = pathFor("missing.db");
    const response = await createApp(path).request("/api/v1/overview");
    const text = await response.text();
    expect(response.status).toBe(503);
    expect(JSON.parse(text).error.code).toBe("DATABASE_UNAVAILABLE");
    expect(text).not.toContain(path);
  });
  test("不兼容结构返回 DATABASE_SCHEMA_INCOMPATIBLE", async () => {
    const path = pathFor("old.db");
    const database = new Database(path, { create: true });
    database.exec("CREATE TABLE skills (id TEXT)");
    database.close();
    const response = await createApp(path).request("/api/v1/scenarios");
    expect(response.status).toBe(422);
    expect(((await response.json()) as any).error.code).toBe(
      "DATABASE_SCHEMA_INCOMPATIBLE",
    );
  });
});
