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
  await expect(page.getByRole("table", { name: "Skill 列表" })).toBeVisible();

  await page.locator(".page-size-control .ant-select").click();
  await page.getByText("20 条/页", { exact: true }).click();
  await expect(page).toHaveURL(/pageSize=20/);
});
