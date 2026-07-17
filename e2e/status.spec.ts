/**
 * 数据库状态浏览器验收，覆盖桌面导航、状态结果与窄屏可用性。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:55:00
 */
import { expect, test } from "@playwright/test";

test("桌面端可查看就绪数据库状态", async ({ page }) => {
  await page.goto("/status");
  await expect(page.getByRole("heading", { name: "数据库状态" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "数据库已就绪" }),
  ).toBeVisible();
  await expect(page.getByText("skills-manager.e2e.db")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
});

test("窄屏下可打开导航并进入 Skills", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/status");
  await page.getByRole("button", { name: "打开导航" }).click();
  await page.getByRole("menuitem", { name: "Skills" }).click();
  await expect(page).toHaveURL(/\/skills$/);
  await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();
});
