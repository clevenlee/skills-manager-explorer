/**
 * 端到端测试配置，使用隔离数据库启动本地 Bun 服务与前端。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:00:00
 */
import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bun tests/fixtures/create-skills-db.ts && bun run dev",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      PORT: "4174",
      VITE_PORT: "5174",
      VITE_API_PORT: "4174",
      SKILLS_MANAGER_DB: resolve("tests/fixtures/skills-manager.e2e.db"),
    },
  },
});
