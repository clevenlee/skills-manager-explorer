/** Skill 全字段与窄屏布局浏览器验收。作者：NDP Coding；日期：2026-07-17 13:20:00 */
import { expect, test } from "@playwright/test";

test("详情展示全字段并在窄屏不横向溢出", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/skills/skill-api");
  await expect(page.getByText("hash-skill-api")).toBeVisible();
  await expect(
    page
      .getByText("https://github.com/acme/skills.git", { exact: true })
      .first(),
  ).toBeVisible();
  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
});
