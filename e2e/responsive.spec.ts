/** 关键页面窄屏无阻断溢出验收。作者：NDP Coding；日期：2026-07-17 13:50:00 */
import { expect, test } from "@playwright/test";

test("关键页面在 390px 宽度内可用", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    "/",
    "/sources",
    "/scenarios",
    "/skills",
    "/compare",
    "/status",
  ]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const width = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(width.scroll, path).toBeLessThanOrEqual(width.client + 1);
  }
});
