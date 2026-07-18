/**
 * 工作区 API 集成测试，验证全局禁用状态优先于历史关联和同步记录。
 * 作者：NDP Coding
 * 日期：2026-07-18 11:30:00
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createApp } from "@/server/app";
import type { Workspace } from "@/shared/contracts/catalog";
import { createSkillsDatabase } from "../fixtures/create-skills-db";

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe("GET /api/v1/workspaces", () => {
  test("返回真实启用状态，disabled_tools 中的工作区保持未启用", async () => {
    const directory = mkdtempSync(join(tmpdir(), "workspace-api-"));
    directories.push(directory);
    const databasePath = join(directory, "skills.db");
    createSkillsDatabase(databasePath);

    const response =
      await createApp(databasePath).request("/api/v1/workspaces");
    const body = (await response.json()) as { data: Workspace[] };

    expect(response.status).toBe(200);
    expect(body.data.find((workspace) => workspace.name === "cursor")).toEqual({
      name: "cursor",
      enabled: false,
      enabledSkillCount: 0,
      enabledScenarioCount: 0,
    });
    expect(
      body.data.find((workspace) => workspace.name === "codex"),
    ).toMatchObject({
      name: "codex",
      enabled: true,
    });
  });
});
