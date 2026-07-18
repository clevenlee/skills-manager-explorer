/** 可重试错误状态浏览器验收。作者：NDP Coding；日期：2026-07-17 13:50:00 */
import { expect, test } from "@playwright/test";

test("请求失败后可重试恢复", async ({ page }) => {
  let intercepted = false;
  await page.route("**/api/v1/overview", async (route) => {
    if (!intercepted) {
      intercepted = true;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "DATABASE_UNAVAILABLE",
            message: "数据库暂时不可用。",
            details: {},
          },
          meta: { requestId: "test" },
        }),
      });
      return;
    }
    await route.continue();
  });
  await page.goto("/");
  await expect(page.getByText("出错了", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "重新尝试" }).click();
  await expect(page.getByRole("link", { name: /Skills/ })).toBeVisible();
});
