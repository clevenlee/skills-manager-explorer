/**
 * Vite 开发端口配置回归测试。
 * 作者：NDP Coding
 * 日期：2026-07-17 08:55:00
 */
import { describe, expect, test } from "bun:test";

import { resolveVitePorts } from "../../vite.config";

describe("resolveVitePorts", () => {
  test("没有环境变量时与本地服务默认端口保持一致", () => {
    expect(resolveVitePorts({})).toEqual({ webPort: 5173, apiPort: 4173 });
  });

  test("优先使用独立的 API 代理端口", () => {
    expect(
      resolveVitePorts({
        PORT: "4273",
        VITE_API_PORT: "4373",
        VITE_PORT: "5273",
      }),
    ).toEqual({ webPort: 5273, apiPort: 4373 });
  });
});
