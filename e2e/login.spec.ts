import { interceptAuthService } from "./fixtures/auth.ts";
import { test, expect } from "@playwright/test";
import { interceptTaskApi } from "./fixtures/task-api.ts";

test.beforeEach(async ({ page }) => {
  await interceptAuthService(page);
  await interceptTaskApi(page);
});

test("登录页直接访问与刷新、桌面双栏/手机表单优先，无横向溢出", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "欢迎回来", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "欢迎回来", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "种下一份专注，收获更好的自己。",
      exact: true,
    }),
  ).toBeVisible();
  const artwork = page.getByRole("img", {
    name: "温暖的浮空花园：小屋、树木、向日葵与溪流，陪伴每一次专注",
    exact: true,
  });
  await expect(artwork).toBeVisible();
  expect(
    await artwork.evaluate(
      (element) => (element as HTMLImageElement).naturalWidth,
    ),
  ).toBeGreaterThan(0);
  const card = await page.locator(".fg-login-card").boundingBox();
  const story = await page.locator(".fg-login-story").boundingBox();
  if (testInfo.project.name === "mobile")
    expect(card!.y).toBeLessThan(story!.y);
  else expect(card!.x).toBeGreaterThan(story!.x);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/login-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("必填和邮箱格式反馈、密码可见切换，不发登录请求、不保存凭据", async ({
  page,
}) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await page.goto("/login");
  const email = page.getByRole("textbox", { name: "邮箱", exact: true });
  const password = page.getByLabel("密码", { exact: true });
  await email.focus();
  await email.press("Tab");
  await expect(page.getByText("请输入邮箱地址", { exact: true })).toBeVisible();
  await email.fill("not-an-email");
  await email.press("Tab");
  await expect(
    page.getByText("请输入有效的 ASCII 邮箱地址（最多 254 字符）", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await email.fill("gardener@example.com");
  await email.press("Tab");
  await expect(email).toHaveAttribute("aria-invalid", "false");
  await password.focus();
  await password.press("Tab");
  await expect(page.getByText("请输入密码", { exact: true })).toBeVisible();
  await password.fill("  password-preview  ");
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "显示密码", exact: true }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toHaveValue("  password-preview  ");
  await page.getByRole("button", { name: "隐藏密码", exact: true }).click();
  await expect(password).toHaveAttribute("type", "password");
  await expect(
    page.getByRole("button", { name: "登录", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("link", { name: "立即注册", exact: true }),
  ).toHaveAttribute("href", "/register");
  await expect(
    page.getByRole("link", { name: "忘记密码？", exact: true }),
  ).toHaveAttribute("href", "/forgot-password");
  expect(posts).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    })),
  ).toEqual({ local: [], session: [] });
  await expect(page).toHaveURL("/login");
});

test("未登录没有返回首页入口，320px 与平板布局正常", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/login");
  await expect(
    page.getByRole("heading", { name: "欢迎回来", exact: true }),
  ).toBeVisible();
  for (const width of [320, 768, 1024, 1586]) {
    await page.setViewportSize({ width, height: 992 });
    await expect(
      page.getByRole("heading", { name: "欢迎回来", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator(".fg-login-page")
        .evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
  }
  await expect(
    page.getByRole("link", { name: "返回首页", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "专注花园首页", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("link")).toHaveCount(3); // 表单跳转、注册、找回密码。
});
