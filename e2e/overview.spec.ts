/** 概览页面浏览器验收。作者：NDP Coding；日期：2026-07-17 13:20:00 */
import { expect, test } from "@playwright/test";

test("概览展示核心指标并跳转孤立 Skill", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /一眼看清/ })).toBeVisible();
  await expect(page.getByText("6", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: /未归属/ }).click();
  await expect(page).toHaveURL(/\/skills\?orphan=true/);
  await expect(page.getByRole("link", { name: /独立技能/ })).toBeVisible();
});

test("概览可下钻查看重复归属 Skill", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /重复归属/ }).click();
  await expect(page).toHaveURL(/\/skills\?multiScenario=true/);
  await expect(page.getByRole("link", { name: /API 设计/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /测试驱动/ })).toBeVisible();
});
