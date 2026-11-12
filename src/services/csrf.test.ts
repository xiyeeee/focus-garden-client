import { expect, it, vi } from "vitest";
import { createCsrfManager } from "./csrf";
import type { CsrfVO } from "./auth/types";
it("并发写请求共用一次 CSRF 获取，缓存仅在内存，clear 后重新获取", async () => {
  const load = vi.fn(async (): Promise<CsrfVO> => ({
    headerName: "X-CSRF-TOKEN",
    token: "current",
  }));
  const manager = createCsrfManager(load);
  await Promise.all([manager.get(), manager.get(), manager.get()]);
  expect(load).toHaveBeenCalledTimes(1);
  await manager.get();
  expect(load).toHaveBeenCalledTimes(1);
  manager.clear();
  await manager.get();
  expect(load).toHaveBeenCalledTimes(2);
});
it("会话轮换后旧 CSRF 请求不能覆盖新的 token", async () => {
  let finish: (value: CsrfVO) => void = () => {};
  const load = vi
    .fn<() => Promise<CsrfVO>>()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValue({ headerName: "X-CSRF-TOKEN", token: "new-session" });
  const manager = createCsrfManager(load);
  const old = manager.get();
  const current = await manager.refresh();
  finish({ headerName: "X-CSRF-TOKEN", token: "old-session" });
  expect((await old).token).toBe("new-session");
  expect((await manager.get()).token).toBe(current.token);
});
