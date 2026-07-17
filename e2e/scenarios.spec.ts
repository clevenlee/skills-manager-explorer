/** 场景清单与详情浏览器验收。作者：NDP Coding；日期：2026-07-17 13:20:00 */
import { expect, test } from "@playwright/test";

test("场景保持只读并下钻到 Skill", async ({ page }) => {
  await page.goto("/scenarios");
  await expect(
    page.getByRole("button", { name: /新增|编辑|删除/ }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: /代码审查/ }).click();
  await expect(page.getByRole("heading", { name: "代码审查" })).toBeVisible();
  await expect(page.getByRole("link", { name: /安全加固/ })).toBeVisible();
});
