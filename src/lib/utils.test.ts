import { expect, it } from "vitest";
import { localDate, clock } from "./utils";
it("本地日期使用本地日历字段，避免 UTC 偏移", () => {
  const date = new Date(2026, 10, 12, 0, 15);
  expect(localDate(date.getTime())).toBe("2026-11-12");
});
it("显示时间向上取整，避免未结束时提前显示 00:00", () => {
  expect(clock(1)).toBe("00:01");
  expect(clock(-5)).toBe("00:00");
  expect(clock(60000)).toBe("01:00");
});
