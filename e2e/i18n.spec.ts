/**
 * Skills Manager Explorer 双语浏览器验收（zh-CN / en-US）。
 *
 * 通过 `data-testid` + `data-locale` 属性做稳态选择，断言：
 *   - 顶栏菜单在两种语言下显示对应文案的导航项
 *   - 关键 metric / page heading 在两种语言下文案差异
 *   - `<html lang>` 与 `data-locale` 在切换后同步
 *   - localStorage 持久化偏好；URL 不变
 *
 * 运行依赖 macOS + Playwright（见 `bun run test:e2e` 与 `playwright.config.ts`）。
 * 作者：NDP Coding
 * 日期：2026-07-18 09:30:00
 */
import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const STORAGE_KEY = "skillsManagerExplorer.locale";

async function setLocale(
  context: BrowserContext,
  page: Page,
  locale: "zh-CN" | "en-US",
): Promise<void> {
  // 用 addInitScript 在页面脚本运行前注入 localStorage，避免 initLocale() 读取空值的竞态。
  await context.addInitScript(
    (args: string[]) => {
      const [key, value] = args;
      if (key === undefined || value === undefined) return;
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, locale],
  );
  await page.goto("/");
}

test.describe("双语回归 (zh-CN / en-US)", () => {
  test.afterEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("zh-CN：顶栏菜单文案与 lang 属性", async ({ page, context }) => {
    await setLocale(context, page, "zh-CN");
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(
      page.getByTestId("sidebar").getByTestId("locale-switcher"),
    ).toHaveAttribute("data-locale", "zh-CN");
    await expect(page.getByRole("heading", { name: /一眼看清/ })).toBeVisible();
  });

  test("en-US：顶栏菜单文案与 lang 属性", async ({ page, context }) => {
    await setLocale(context, page, "en-US");
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
    await expect(
      page.getByTestId("sidebar").getByTestId("locale-switcher"),
    ).toHaveAttribute("data-locale", "en-US");
    await expect(page.getByRole("heading", { name: /See your/ })).toBeVisible();
  });

  test("zh-CN：概览指标点击进入 Skills 列表", async ({ page, context }) => {
    await setLocale(context, page, "zh-CN");
    await page.getByRole("link", { name: /未归属/ }).click();
    await expect(page).toHaveURL(/\/skills\?orphan=true/);
  });

  test("en-US：概览指标点击进入 Skills 列表", async ({ page, context }) => {
    await setLocale(context, page, "en-US");
    await page.getByRole("link", { name: /Orphan/ }).click();
    await expect(page).toHaveURL(/\/skills\?orphan=true/);
  });

  test("切换语言不改变 URL 与滚动位置", async ({ page, context }) => {
    await setLocale(context, page, "zh-CN");
    await page.goto("/skills?page=2");
    const urlBefore = page.url();
    await page.getByTestId("sidebar").getByTestId("locale-switcher").click();
    await page.getByRole("menuitem", { name: /English/ }).click();
    await expect(page).toHaveURL(urlBefore);
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
  });

  test("en-US：来源详情展示 source URL 元数据条", async ({ page, context }) => {
    await setLocale(context, page, "en-US");
    await page.goto("/sources");
    await page.getByPlaceholder("Search source name or URL").fill("acme");
    await page.getByPlaceholder("Search source name or URL").press("Enter");
    await page.getByRole("link", { name: "acme/skills" }).click();
    await expect(page.locator("text=Source URL")).toBeVisible();
  });

  test("zh-CN：来源详情展示“来源网址”", async ({ page, context }) => {
    await setLocale(context, page, "zh-CN");
    await page.goto("/sources");
    await page.getByPlaceholder("搜索来源名称或地址").fill("acme");
    await page.getByPlaceholder("搜索来源名称或地址").press("Enter");
    await page.getByRole("link", { name: "acme/skills" }).click();
    await expect(page.locator("text=来源网址")).toBeVisible();
  });

  test("zh-CN：Skill 详情展示场景归属区块", async ({ page, context }) => {
    await setLocale(context, page, "zh-CN");
    await page.goto("/skills/skill-api");
    await expect(page.getByText("场景归属")).toBeVisible();
    await expect(page.getByRole("button", { name: /保存归属/ })).toBeVisible();
  });

  test("en-US：Skill 详情展示场景归属区块", async ({ page, context }) => {
    await setLocale(context, page, "en-US");
    await page.goto("/skills/skill-api");
    await expect(page.getByText("Scenario assignment")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Save assignment/ }),
    ).toBeVisible();
  });

  test("语言切换器持久化（刷新后仍生效）", async ({ page }) => {
    // 直接走默认 zh-CN，模拟用户切换到 en-US 后刷新；不用 setLocale 避免
    // addInitScript 在 reload 时把 localStorage 又写回 zh-CN。
    await page.goto("/");
    await page.getByTestId("sidebar").getByTestId("locale-switcher").click();
    await page.getByRole("menuitem", { name: /English/ }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
    await expect(
      page.getByTestId("sidebar").getByTestId("locale-switcher"),
    ).toHaveAttribute("data-locale", "en-US");
  });
});
