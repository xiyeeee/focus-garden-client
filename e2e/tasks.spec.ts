import { interceptAuthService } from "./fixtures/auth.ts";
import { test, expect } from "@playwright/test";
import { interceptTaskApi, taskFixture } from "./fixtures/task-api.ts";
test.beforeEach(async ({ page }) => {
  await interceptAuthService(page, true);
});

const editTask = async (
  page: import("@playwright/test").Page,
  title: string,
) => {
  await page.getByRole("button", { name: `更多操作：${title}` }).click();
  await page.getByRole("menuitem", { name: "编辑任务" }).click();
};
test("真实契约 CRUD：新增、读取详情、编辑保留 IN_PROGRESS、完成和重新打开、删除", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const state = await interceptTaskApi(page, [taskFixture()]);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "后端任务", exact: true }),
  ).toBeVisible();
  await editTask(page, "后端任务");
  await expect(page.getByRole("dialog").getByLabel("任务名称")).toHaveValue(
    "后端任务",
  );
  await page.getByRole("dialog").getByLabel("任务名称").fill("修改后的任务");
  await page.getByLabel("备注").fill("  保留备注  ");
  await page.getByRole("button", { name: "保存修改", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const update = state.writes.find((write) => write.method === "PUT")!;
  expect(update.path).toBe("/api/tasks/9223372036854775807");
  expect(update.body).toMatchObject({
    status: "IN_PROGRESS",
    description: "  保留备注  ",
    plantType: "tulip",
  });
  await page.getByRole("checkbox", { name: "完成任务：修改后的任务" }).click();
  await expect(
    page.getByRole("checkbox", { name: "重新打开：修改后的任务" }),
  ).toBeChecked();
  await page.getByRole("checkbox", { name: "重新打开：修改后的任务" }).click();
  await expect(
    page.getByRole("checkbox", { name: "完成任务：修改后的任务" }),
  ).not.toBeChecked();
  await page.getByRole("button", { name: "新建任务", exact: true }).click();
  await page.getByRole("dialog").getByLabel("任务名称").fill("  新计划  ");
  await page.getByLabel("计划专注时长").fill("45");
  await page.getByRole("button", { name: "创建任务", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "新计划", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "新计划", exact: true }),
  ).toBeVisible();
  expect(
    state.writes.filter(
      (write) => write.path === "/api/tasks" && write.method === "POST",
    ),
  ).toHaveLength(1);
  await page.getByRole("button", { name: "更多操作：新计划" }).click();
  await page.getByRole("menuitem", { name: "删除任务" }).click();
  await page.getByRole("button", { name: "确认删除" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "新计划", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("focus-garden:v1")),
  ).toBeNull();
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/tasks-${testInfo.project.name}.png`,
  });
});
test("分页、搜索、三态过滤和删除末页回退，统计不拿第一页冒充全部", async ({
  page,
}) => {
  const initial = Array.from({ length: 11 }, (_, index) =>
    taskFixture({
      id: String(index + 1),
      title: `计划 ${index + 1}`,
      status: index === 0 ? "IN_PROGRESS" : "TODO",
    }),
  );
  const state = await interceptTaskApi(page, initial);
  await page.goto("/");
  const total = page.locator(".fg-statistic").filter({
    has: page.getByRole("heading", { name: "任务总数", exact: true }),
  });
  await expect(total.locator("strong")).toHaveText("11");
  await page.getByRole("button", { name: "下一页" }).click();
  await expect(
    page.getByRole("heading", { name: "计划 11", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "更多操作：计划 11" }).click();
  await page.getByRole("menuitem", { name: "删除任务" }).click();
  await page.getByRole("button", { name: "确认删除" }).click();
  await expect(page.getByText("第 1 / 1 页", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "进行中", exact: true }).click();
  await expect(page.locator(".fg-remote-task-row")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "计划 1", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "全部", exact: true }).click();
  await page.getByRole("textbox", { name: "搜索任务名称" }).fill("不存在");
  await page.getByRole("button", { name: "搜索任务", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "还没有匹配的任务" }),
  ).toBeVisible();
  expect(state.tasks).toHaveLength(10);
});
test("空白校验、保存失败保留输入、保存中防重复提交，GET 失败重试", async ({
  page,
}) => {
  const state = await interceptTaskApi(page);
  state.failList = true;
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "重新加载任务" }),
  ).toBeVisible();
  state.failList = false;
  await page.getByRole("button", { name: "重新加载任务" }).click();
  await expect(
    page.getByRole("heading", { name: "从一件小事开始" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "新建任务", exact: true }).click();
  await page.getByRole("dialog").getByLabel("任务名称").fill("   ");
  await page.getByRole("button", { name: "创建任务", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "非空",
  );
  expect(state.writes).toHaveLength(0);
  state.failCreate = true;
  await page.getByRole("dialog").getByLabel("任务名称").fill("保留输入");
  await page.getByRole("button", { name: "创建任务", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "title：",
  );
  await expect(page.getByRole("dialog").getByLabel("任务名称")).toHaveValue(
    "保留输入",
  );
  expect(state.writes).toHaveLength(1);
  state.failCreate = false;
  state.delayCreate = 500;
  await page.getByRole("button", { name: "创建任务", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "保存中…", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(state.writes.filter((write) => write.method === "POST")).toHaveLength(
    2,
  );
});
test("详情不存在可反馈并关闭，编辑/删除失败保留弹窗", async ({ page }) => {
  const state = await interceptTaskApi(page, [taskFixture()]);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "后端任务", exact: true }),
  ).toBeVisible();
  state.failDetails = true;
  await editTask(page, "后端任务");
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText(
    "任务不存在",
  );
  await page.getByRole("button", { name: "关闭", exact: true }).click();
  state.failDetails = false;
  state.failUpdate = true;
  await editTask(page, "后端任务");
  await page.getByRole("dialog").getByLabel("任务名称").fill("未保存的名称");
  await page.getByRole("button", { name: "保存修改", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "备注内容",
  );
  await expect(page.getByRole("dialog").getByLabel("任务名称")).toHaveValue(
    "未保存的名称",
  );
  await page.getByRole("button", { name: "取消", exact: true }).click();
  state.failDelete = true;
  await page.getByRole("button", { name: "更多操作：后端任务" }).click();
  await page.getByRole("menuitem", { name: "删除任务" }).click();
  await page.getByRole("button", { name: "确认删除" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText(
    "删除失败，请稍后重试",
  );
  await expect(page.getByRole("dialog")).toBeVisible();
});
