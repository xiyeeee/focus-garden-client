import { describe, expect, it } from "vitest";
import { validateLogin, validateUsername } from "./login-form";

describe("昵称作为登录用户名", () => {
  it("支持中文昵称和既有英文用户名", () => {
    expect(validateUsername(" 花友🌱 ")).toBeUndefined();
    expect(validateUsername("xiye")).toBeUndefined();
    expect(validateLogin({ username: "花友", password: " password123 " })).toEqual({});
  });

  it("拒绝空登录名、邮箱、控制字符和超长名称", () => {
    [" ", "user@example.com", "bad\nname", "a".repeat(33)].forEach((username) => {
      expect(validateUsername(username)).toBeDefined();
    });
  });
});
