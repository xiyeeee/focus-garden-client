import { describe, it, expect } from "vitest";
import type { FocusSession } from "@/types";
import { elapsedMs, settleSessions } from "./timer";
import { initialData } from "@/services/storage";
const session = (values: Partial<FocusSession> = {}): FocusSession => ({
  id: "session",
  taskId: "task",
  taskTitle: "阅读",
  plantType: "fern",
  plannedMinutes: 25,
  actualMs: 0,
  status: "running",
  startedAt: 1000,
  resumedAt: 1000,
  endedAt: null,
  breakEndsAt: null,
  ...values,
});
describe("时间戳计时", () => {
  it("后台返回时直接校准，且最大不超过计划时长", () => {
    expect(elapsedMs(session(), 61000)).toBe(60000);
    expect(elapsedMs(session(), 9999999)).toBe(1500000);
  });
  it("暂停期间不累计，恢复只累计新一段时间", () => {
    expect(
      elapsedMs(
        session({ status: "paused", actualMs: 45000, resumedAt: null }),
        9999999,
      ),
    ).toBe(45000);
    expect(
      elapsedMs(session({ actualMs: 45000, resumedAt: 200000 }), 210000),
    ).toBe(55000);
  });
  it("系统时钟回拨时不产生负时长", () =>
    expect(elapsedMs(session(), 0)).toBe(0));
  it("重复结算只发放一株植物，结束时间为真实到点时间", () => {
    const data = initialData();
    data.sessions = [session()];
    settleSessions(data, 2000000);
    settleSessions(data, 3000000);
    expect(data.plants).toHaveLength(1);
    expect(data.sessions[0].status).toBe("completed");
    expect(data.sessions[0].endedAt).toBe(1501000);
    expect(data.plants[0].obtainedAt).toBe(1501000);
  });
  it("暂停和放弃的记录不结算奖励", () => {
    const data = initialData();
    data.sessions = [
      session({ status: "paused", actualMs: 1000 }),
      session({ id: "abandoned", status: "abandoned", actualMs: 2000 }),
    ];
    settleSessions(data, 9999999);
    expect(data.plants).toHaveLength(0);
  });
});
