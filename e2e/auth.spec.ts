import { test, expect } from "@playwright/test";
import { interceptAuthService } from "./fixtures/auth.ts";
import { interceptTaskApi, taskFixture } from "./fixtures/task-api.ts";

test("未登录访问所有业务路由及刷新均回到登录页，不请求任务数据", async ({
  page,
}) => {
  await interceptAuthService(page);
  const taskRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/tasks"))
      taskRequests.push(request.url());
  });
  for (const path of [
    "/",
    "/records",
    "/collection",
    "/settings",
    "/focus/preview",
    "/missing",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL("/login");
    await expect(
      page.getByRole("heading", { name: "欢迎回来", exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL("/login");
    await expect(
      page.getByRole("heading", { name: "欢迎回来", exact: true }),
    ).toBeVisible();
  }
  expect(taskRequests).toEqual([]);
});

test("服务确认登录后进入首页，设置只有退出登录，退出后刷新和后退不能进入首页", async ({
  page,
}) => {
  const auth = await interceptAuthService(page);
  await interceptTaskApi(page, [taskFixture()]);
  await page.goto("/");
  await expect(page).toHaveURL("/login");
  await page.getByRole("button", { name: "邮箱登录", exact: true }).click();
  await page
    .getByRole("textbox", { name: "邮箱", exact: true })
    .fill("gardener@example.com");
  await page.getByLabel("密码", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { name: "后端任务", exact: true }),
  ).toBeVisible();
  expect(auth.loginCalls).toBe(1);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "今日任务", level: 1 }),
  ).toBeVisible();
  await page.getByRole("link", { name: "账号设置", exact: true }).click();
  await expect(page).toHaveURL("/settings");
  await expect(page.locator("main button")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "退出登录", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "退出登录", exact: true }).click();
  await expect(page).toHaveURL("/login");
  expect(auth.logoutCalls).toBe(1);
  await page.goBack();
  await expect(page).toHaveURL("/login");
  await page.reload();
  await expect(page).toHaveURL("/login");
  await expect(
    page.getByRole("heading", { name: "欢迎回来", exact: true }),
  ).toBeVisible();
});

test("登录和退出失败有反馈，登录失败不得跳首页，退出失败可重试", async ({
  page,
}) => {
  const auth = await interceptAuthService(page);
  auth.failLogin = true;
  await interceptTaskApi(page);
  await page.goto("/login");
  await page.getByRole("button", { name: "邮箱登录", exact: true }).click();
  await page
    .getByRole("textbox", { name: "邮箱", exact: true })
    .fill("gardener@example.com");
  await page.getByLabel("密码", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("邮箱或密码错误");
  await expect(page).toHaveURL("/login");
  await expect(page.getByLabel("密码", { exact: true })).toHaveValue(
    "test-password",
  );
  auth.failLogin = false;
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("link", { name: "账号设置", exact: true }).click();
  auth.failLogout = true;
  await page.getByRole("button", { name: "退出登录", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("退出失败");
  await expect(page).toHaveURL("/settings");
  auth.failLogout = false;
  await page.getByRole("button", { name: "退出登录", exact: true }).click();
  await expect(page).toHaveURL("/login");
});

test("会话验证失败不展示业务页，重新验证成功后进入；已登录访问登录页回首页", async ({
  page,
}) => {
  const auth = await interceptAuthService(page, true);
  auth.failSession = true;
  await interceptTaskApi(page);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "暂时无法确认登录状态", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "今日任务", level: 1 }),
  ).toHaveCount(0);
  auth.failSession = false;
  await page.getByRole("button", { name: "重试验证", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "今日任务", level: 1 }),
  ).toBeVisible();
  await page.goto("/login");
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { name: "今日任务", level: 1 }),
  ).toBeVisible();
});

test("退出清理业务缓存，下次登录不得复用上一位用户的任务", async ({ page }) => {
  const auth = await interceptAuthService(page, true);
  const tasks = await interceptTaskApi(page, [
    taskFixture({ title: "上一位用户的任务" }),
  ]);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "上一位用户的任务", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "账号设置", exact: true }).click();
  await page.getByRole("button", { name: "退出登录", exact: true }).click();
  await expect(page).toHaveURL("/login");
  auth.user = { ...auth.user, id: "2", email: "another@example.com" };
  tasks.tasks = [taskFixture({ id: "2", title: "新的任务" })];
  await page.getByRole("button", { name: "邮箱登录", exact: true }).click();
  await page
    .getByRole("textbox", { name: "邮箱", exact: true })
    .fill("another@example.com");
  await page.getByLabel("密码", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { name: "新的任务", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "上一位用户的任务", exact: true }),
  ).toHaveCount(0);
});
