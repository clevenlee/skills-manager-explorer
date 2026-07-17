/** 来源与场景集合比对浏览器验收。作者：NDP Coding；日期：2026-07-17 13:20:00 */
import { expect, test } from "@playwright/test";

test("比对四种计数并交换左右集合", async ({ page }) => {
  const sources = (await (
    await page.request.get("/api/v1/sources?q=acme")
  ).json()) as { data: Array<{ id: string }> };
  const left = `source:${sources.data[0]?.id}`;
  await page.goto(
    `/compare?left=${encodeURIComponent(left)}&right=scenario%3Ascenario-review`,
  );
  await expect(page.getByText("差异 2", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /API 设计/ })).toBeVisible();
  await page.getByRole("button", { name: "交换左右集合" }).click();
  await expect(page).toHaveURL(/left=scenario:scenario-review/);
  await expect(page.getByText("仅左 1", { exact: true })).toBeVisible();
});
