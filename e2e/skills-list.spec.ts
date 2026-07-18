/** Skill 搜索筛选与 URL 恢复浏览器验收。作者：NDP Coding；日期：2026-07-17 13:20:00 */
import { expect, test } from "@playwright/test";

test("搜索条件写入 URL 且详情返回后恢复", async ({ page }) => {
  await page.goto("/skills");
  await page.getByPlaceholder("搜索名称或描述").fill("API");
  await page.getByPlaceholder("搜索名称或描述").press("Enter");
  await expect(page).toHaveURL(/q=API/);
  await page.getByRole("link", { name: /API 设计/ }).click();
  await expect(page.getByRole("heading", { name: "API 设计" })).toBeVisible();
  await page.getByRole("link", { name: "← 返回列表" }).click();
  await expect(page).toHaveURL(/\/skills\?q=API/);
  await expect(page.getByPlaceholder("搜索名称或描述")).toHaveValue("API");
});

test("支持表格视图、重复归属筛选和分页数量选择", async ({ page }) => {
  await page.goto("/skills");
  await expect(page.getByRole("radio", { name: "块状" })).toBeChecked();
  await page.getByRole("checkbox", { name: "仅重复归属" }).check();
  await expect(page).toHaveURL(/multiScenario=true/);
  await expect(page.getByRole("link", { name: /API 设计/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /测试驱动/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /独立技能/ })).not.toBeVisible();

  await page.getByText("表格", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "表格" })).toBeChecked();
  await expect(page.getByRole("table", { name: "Skills" })).toBeVisible();

  await page.locator(".page-size-control .ant-select").click();
  await page.getByText("20 条/页", { exact: true }).click();
  await expect(page).toHaveURL(/pageSize=20/);
});

test("批量添加场景使用平铺多选并刷新列表归属", async ({ page }) => {
  await page.goto("/skills");
  await page.getByRole("checkbox", { name: "API 设计" }).check();
  await page.getByRole("checkbox", { name: "独立技能" }).check();
  await page.getByRole("button", { name: "添加到场景" }).click();

  const dialog = page.getByRole("dialog", { name: "添加到场景" });
  await expect(dialog.getByRole("combobox")).toHaveCount(0);
  await expect(
    dialog.getByRole("checkbox", { name: "编码开发" }),
  ).toBeVisible();
  await dialog.getByRole("checkbox", { name: "空场景" }).check();
  await dialog.getByRole("button", { name: /保\s*存/ }).click();

  await expect(page.getByText("已添加到 2 个 Skill")).toBeVisible();
  await expect(
    page.locator(".skill-card", { hasText: "API 设计" }),
  ).toContainText("空场景");
  await expect(
    page.locator(".skill-card", { hasText: "独立技能" }),
  ).toContainText("空场景");

  const apiCleanup = await page.request.put(
    "/api/v1/skills/skill-api/scenarios",
    {
      data: {
        expectedScenarioIds: [
          "scenario-dev",
          "scenario-empty",
          "scenario-plan",
        ],
        scenarioIds: ["scenario-dev", "scenario-plan"],
      },
    },
  );
  expect(apiCleanup.ok()).toBeTruthy();
  const orphanCleanup = await page.request.put(
    "/api/v1/skills/skill-orphan/scenarios",
    {
      data: {
        expectedScenarioIds: ["scenario-empty"],
        scenarioIds: [],
      },
    },
  );
  expect(orphanCleanup.ok()).toBeTruthy();
});
