/** 来源清单与详情浏览器验收。作者：NDP Coding；日期：2026-07-17 13:20:00 */
import { expect, test } from "@playwright/test";

test("来源可搜索并下钻到过滤 Skill", async ({ page }) => {
  await page.goto("/sources");
  await page.getByPlaceholder("搜索来源名称或地址").fill("acme");
  await page.getByPlaceholder("搜索来源名称或地址").press("Enter");
  await page.getByRole("link", { name: "acme/skills" }).click();
  await expect(
    page.getByRole("heading", { name: "acme/skills" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /API 设计/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /测试驱动开发/ })).toBeVisible();
});
