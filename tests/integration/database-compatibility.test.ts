/**
 * 数据库边界集成测试，证明正常、缺失与不兼容文件均不会触碰用户数据库。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:20:00
 */
import { Database } from "bun:sqlite";
import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { checkSchema } from "@/server/database/check-schema";
import {
  openReadDatabase,
  openWriteDatabase,
} from "@/server/database/open-database";
import { createSkillsDatabase } from "../fixtures/create-skills-db";

const temporaryDirectories: string[] = [];

function temporaryPath(name: string): string {
  const directory = mkdtempSync(join(tmpdir(), "skills-manager-explorer-"));
  temporaryDirectories.push(directory);
  return join(directory, name);
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { recursive: true });
});

describe("数据库兼容边界", () => {
  test("接受兼容数据库并为写连接启用外键", () => {
    const path = temporaryPath("valid.db");
    createSkillsDatabase(path);
    const readDatabase = openReadDatabase(path);
    expect(checkSchema(readDatabase)).toEqual({
      compatible: true,
      missing: [],
    });
    readDatabase.close();

    const writeDatabase = openWriteDatabase(path);
    expect(
      writeDatabase
        .query<{ foreign_keys: number }, []>("PRAGMA foreign_keys")
        .get()?.foreign_keys,
    ).toBe(1);
    writeDatabase.close();
  });

  test("数据库缺失时抛出错误且不创建文件", () => {
    const path = temporaryPath("missing.db");
    expect(() => openReadDatabase(path)).toThrow("DATABASE_FILE_NOT_FOUND");
    expect(existsSync(path)).toBeFalse();
  });

  test("准确报告缺失表与字段，同时允许额外结构", () => {
    const path = temporaryPath("incompatible.db");
    const database = new Database(path, { create: true });
    database.exec(
      "CREATE TABLE skills (id TEXT PRIMARY KEY, extra TEXT); CREATE TABLE extra_table (id TEXT);",
    );
    const result = checkSchema(database);
    expect(result.compatible).toBeFalse();
    expect(result.missing).toContain("table:scenarios");
    expect(result.missing).toContain("table:scenario_skills");
    expect(result.missing).toContain("column:skills.name");
    expect(result.missing).not.toContain("table:extra_table");
    database.close();
  });
});
