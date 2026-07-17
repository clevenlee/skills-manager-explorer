/** 单个 Skill 场景归属二次确认浏览器验收。作者：NDP Coding；日期：2026-07-17 13:20:00 */
import { expect, test } from "@playwright/test";

test("新增归属需二次确认并刷新详情", async ({ page }) => {
  await page.goto("/skills/skill-api");
  const selector = page.locator(".scenario-select");
  await selector.click();
  await page.getByText("代码审查", { exact: true }).last().click();
  await page.getByRole("button", { name: "保存归属" }).click();
  await expect(page.getByText("确认调整场景归属？")).toBeVisible();
  await page.getByRole("button", { name: "确认保存" }).click();
  await expect(page.getByText("场景归属已更新")).toBeVisible();
  await expect(selector.getByText("代码审查")).toBeVisible();
  const cleanup = await page.request.put("/api/v1/skills/skill-api/scenarios", {
    data: {
      expectedScenarioIds: ["scenario-dev", "scenario-plan", "scenario-review"],
      scenarioIds: ["scenario-dev", "scenario-plan"],
    },
  });
  expect(cleanup.ok()).toBeTruthy();
});
