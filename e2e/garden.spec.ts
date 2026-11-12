import { interceptAuthService } from "./fixtures/auth.ts";
import { interceptTaskApi } from "./fixtures/task-api.ts";
import { test, expect, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await interceptAuthService(page, true);
  await interceptTaskApi(page);
});

const routes = [
  { path: "/", title: "今日任务", navigation: "今日任务" },
  { path: "/records", title: "成长记录", navigation: "成长记录" },
  { path: "/collection", title: "植物收藏", navigation: "植物收藏" },
  { path: "/settings", title: "设置", navigation: "设置" },
  { path: "/focus/layout-preview", title: "留一段时间，给专注" },
  { path: "/missing-page", title: "好像走到花园的小路外了" },
];

const openNavigation = async (page: Page, mobile: boolean) => {
  if (mobile) await page.getByRole("button", { name: "打开导航" }).click();
};
const expectNoOverflow = async (page: Page) => {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator("main")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
};

test("所有页面可直接访问和刷新，资源正确加载，无横向溢出", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of routes) {
    await page.goto(route.path);
    await expect(
      page.getByRole("heading", { level: 1, name: route.title }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: route.title }),
    ).toBeVisible();
    await expectNoOverflow(page);
    await expect
      .poll(() =>
        page
          .locator("main img")
          .evaluateAll((elements) =>
            elements.every(
              (element) =>
                (element as HTMLImageElement).complete &&
                (element as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    if (route.navigation) {
      const mobile = testInfo.project.name === "mobile";
      await openNavigation(page, mobile);
      await expect(
        page
          .getByRole("navigation", { name: "主导航" })
          .getByRole("link", { name: route.navigation }),
      ).toHaveAttribute("aria-current", "page");
      if (mobile)
        await page.getByRole("button", { name: "关闭", exact: true }).click();
    }
  }
  expect(errors).toEqual([]);
});

test("公共导航正常跳转，手机抽屉选择后关闭、Escape 关闭并恢复焦点", async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name === "mobile";
  await page.goto("/");
  for (const route of routes.filter((route) => route.navigation)) {
    await openNavigation(page, mobile);
    const nav = page.getByRole("navigation", { name: "主导航" });
    await nav
      .getByRole("link", { name: route.navigation!, exact: true })
      .click();
    await expect(page).toHaveURL(route.path);
    await expect(
      page.getByRole("heading", { level: 1, name: route.title }),
    ).toBeVisible();
    if (mobile) await expect(page.getByRole("dialog")).toHaveCount(0);
    await expectNoOverflow(page);
  }
  if (mobile) {
    const trigger = page.getByRole("button", { name: "打开导航" });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.screenshot({
      path: "test-results/stage-two-navigation-mobile.png",
    });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
});

test("任务页面区域完整、专注页仍为独立布局且没有计时", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "新建任务", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "创建第一个任务", exact: true }),
  ).toBeEnabled();
  await expect(page.getByRole("region", { name: "任务统计" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "我的任务", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/stage-two-home-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await openNavigation(page, testInfo.project.name === "mobile");
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name: "植物收藏", exact: true })
    .click();
  await expect(page).toHaveURL("/collection");
  await page.getByRole("link", { name: "返回今日任务", exact: true }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/focus/layout-preview");
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "暂停", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "结束本轮", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText("--:--", { exact: true })).toBeVisible();
  if (testInfo.project.name === "mobile") {
    const controls = await page.locator(".fg-focus-actions").boundingBox();
    expect(controls).not.toBeNull();
    expect(controls!.y + controls!.height).toBeLessThanOrEqual(
      page.viewportSize()!.height,
    );
  }
  await page.screenshot({
    path: `test-results/stage-two-focus-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "返回首页", exact: true }).click();
  await expect(page).toHaveURL("/");
});

test("只滚动主内容区，导航固定；切换路由回到内容顶部，不读写业务存储", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem("focus-garden:v1", "preserved-business-data"),
  );
  await page.setViewportSize({
    width: testInfo.project.name === "mobile" ? 390 : 1280,
    height: 600,
  });
  await expect(
    page.getByRole("heading", { name: "从一件小事开始", exact: true }),
  ).toBeVisible();
  const main = page.locator("#main-content");
  await main.evaluate((element) => (element.scrollTop = element.scrollHeight));
  expect(await main.evaluate((element) => element.scrollTop)).toBeGreaterThan(
    0,
  );
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await openNavigation(page, testInfo.project.name === "mobile");
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name: "成长记录" })
    .click();
  await expect(page).toHaveURL("/records");
  await expect
    .poll(() => main.evaluate((element) => element.scrollTop))
    .toBe(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { level: 1, name: "成长记录" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("focus-garden:v1")),
  ).toBe("preserved-business-data");
});

test("320px 手机与平板宽度无溢出，设置仅包含退出登录", async ({ page }) => {
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/records",
      "/collection",
      "/settings",
      "/focus/layout-preview",
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoOverflow(page);
    }
  }
  await page.goto("/settings");
  await expect(
    page.getByRole("button", { name: "退出登录", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "保存设置", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("switch")).toHaveCount(0);
  await expect(page.locator("main input")).toHaveCount(0);
});
