/**
 * 生产静态服务集成测试，验证首页、前端历史路由与未知 API 的边界。
 * 作者：NDP Coding
 * 日期：2026-07-17 13:35:00
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createApp } from "@/server/app";
import { createSkillsDatabase } from "../fixtures/create-skills-db";

const directory = mkdtempSync(join(tmpdir(), "skills-static-"));
const databasePath = join(directory, "static.db");
beforeAll(() => createSkillsDatabase(databasePath));
afterAll(() => rmSync(directory, { recursive: true }));

describe("生产静态资源", () => {
  test("首页与前端历史路由返回嵌入 HTML", async () => {
    const app = createApp(databasePath);
    for (const path of ["/", "/skills/skill-api"]) {
      const response = await app.request(path);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/html");
      expect(await response.text()).toContain("技能管家浏览器");
    }
  });
  test("未知 API 不回退到前端", async () => {
    expect(
      (await createApp(databasePath).request("/api/v1/unknown")).status,
    ).toBe(404);
  });
});
