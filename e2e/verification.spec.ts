import { test, expect } from "@playwright/test";
import { interceptAuthService } from "./fixtures/auth.ts";
import { interceptTaskApi } from "./fixtures/task-api.ts";
const fillEmail = async (page: import("@playwright/test").Page) =>
  page
    .getByRole("textbox", { name: "邮箱", exact: true })
    .fill("gardener@example.com");
const fillPasswords = async (
  page: import("@playwright/test").Page,
  reset = false,
) => {
  await page
    .getByLabel(reset ? "新密码" : "密码", { exact: true })
    .fill("  密码 🌱 1234  ");
  await page.getByLabel("确认密码", { exact: true }).fill("  密码 🌱 1234  ");
};
test("注册发码保留前导零，成功回登录但不自动进入首页", async ({
  page,
}, testInfo) => {
  const auth = await interceptAuthService(page);
  await page.goto("/login");
  await page.getByRole("link", { name: "立即注册", exact: true }).click();
  await expect(page).toHaveURL("/register");
  await expect(page.getByRole("form", { name: "邮箱注册", exact: true })).toBeVisible();
  await fillEmail(page);
  await page.getByRole("button", { name: "获取验证码", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("如可处理");
  expect(auth.lastPurpose).toBe("REGISTER");
  await expect(page.getByRole("button", { name: /秒后重发/ })).toBeDisabled();
  await page.getByLabel("邮箱验证码", { exact: true }).fill("012345");
  await page.getByLabel("昵称 / 登录用户名（选填）", { exact: true }).fill("测试花园");
  await fillPasswords(page);
  await page.screenshot({
    path: `test-results/register-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "创建账号", exact: true }).click();
  await expect(page).toHaveURL("/login");
  await expect(page.getByRole("status")).toContainText("注册成功");
  expect(auth.authenticated).toBe(false);
  expect(auth.lastCode).toBe("012345");
  expect(auth.lastPassword).toBe("  密码 🌱 1234  ");
});
test("密码重置使用独立用途和 newPassword，完成后回登录", async ({ page }) => {
  const auth = await interceptAuthService(page);
  await page.goto("/login");
  await page.getByRole("button", { name: "邮箱登录", exact: true }).click();
  await page.getByRole("link", { name: "忘记密码？", exact: true }).click();
  await expect(page).toHaveURL("/forgot-password");
  await expect(page.getByRole("form", { name: "重置密码", exact: true })).toBeVisible();
  await fillEmail(page);
  await page.getByRole("button", { name: "获取验证码", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("如可处理");
  expect(auth.lastPurpose).toBe("RESET_PASSWORD");
  await page.getByLabel("邮箱验证码", { exact: true }).fill("000123");
  await fillPasswords(page, true);
  await page.getByRole("button", { name: "重置密码", exact: true }).click();
  await expect(page).toHaveURL("/login");
  await expect(page.getByRole("status")).toContainText("密码已重置");
  expect(auth.lastCode).toBe("000123");
  expect(auth.resetCalls).toBe(1);
});
test("邮件失败不显示成功，验证码错误保留输入可重试", async ({ page }) => {
  const auth = await interceptAuthService(page);
  auth.failMail = true;
  await page.goto("/register");
  await fillEmail(page);
  await page.getByRole("button", { name: "获取验证码", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("邮件暂时无法发送");
  await expect(page.getByRole("status")).toHaveCount(0);
  auth.failRegister = true;
  await page.getByLabel("邮箱验证码", { exact: true }).fill("012345");
  await fillPasswords(page);
  await page.getByRole("button", { name: "创建账号", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("验证码无效");
  await expect(page.getByLabel("邮箱验证码", { exact: true })).toHaveValue(
    "012345",
  );
  await expect(page).toHaveURL("/register");
});
test("发码与登录限流遵循 Retry-After，不自动重试写请求", async ({ page }) => {
  const auth = await interceptAuthService(page);
  auth.rateLimitMail = true;
  await page.clock.install();
  await page.goto("/register");
  await fillEmail(page);
  await page.getByRole("button", { name: "获取验证码", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("请稍后再获取");
  await expect(page.getByRole("button", { name: /秒后重发/ })).toBeDisabled();
  expect(auth.emailCalls).toBe(1);
  auth.rateLimitMail = false;
  await page.clock.fastForward(4000);
  await expect(
    page.getByRole("button", { name: "获取验证码", exact: true }),
  ).toBeEnabled();
  await page.getByRole("link", { name: "返回登录", exact: true }).click();
  await expect(page).toHaveURL("/login");
  await expect(
    page.getByRole("heading", { name: "欢迎回来", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "邮箱登录", exact: true }).click();
  auth.rateLimitLogin = true;
  await fillEmail(page);
  await page.getByLabel("密码", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("过于频繁");
  await expect(page.getByRole("button", { name: /秒后重试/ })).toBeDisabled();
  expect(auth.loginCalls).toBe(1);
  auth.rateLimitLogin = false;
  await page.clock.fastForward(4000);
  await expect(
    page.getByRole("button", { name: "登录", exact: true }),
  ).toBeEnabled();
});
test("CSRF 失效只刷新并提示，不自动重放登录；刷新失败不误报密码错误", async ({
  page,
}) => {
  const auth = await interceptAuthService(page);
  await interceptTaskApi(page);
  await page.goto("/login");
  await page.getByRole("button", { name: "邮箱登录", exact: true }).click();
  await fillEmail(page);
  await page.getByLabel("密码", { exact: true }).fill("password123");
  auth.invalidCsrfOnce = true;
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("页面验证已更新");
  expect(auth.loginCalls).toBe(0);
  expect(auth.invalidCsrfCalls).toBe(1);
  auth.csrfFailAfterLogin = true;
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { name: "今日任务", level: 1 }),
  ).toBeVisible();
  expect(auth.loginCalls).toBe(1);
  expect(auth.meCalls).toBeGreaterThanOrEqual(2);
});
test("任务请求会话过期清缓存回登录，不展示上一位用户任务", async ({ page }) => {
  await interceptAuthService(page, true);
  await interceptTaskApi(page);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "今日任务", level: 1 }),
  ).toBeVisible();
  await page.route("**/api/tasks**", (route) =>
    route.fulfill({
      status: 401,
      json: { code: "UNAUTHORIZED", message: "请重新登录", data: null },
    }),
  );
  await page.getByRole("button", { name: "刷新任务列表", exact: true }).click();
  await expect(page).toHaveURL("/login");
  await expect(
    page.getByRole("heading", { name: "欢迎回来", exact: true }),
  ).toBeVisible();
});
