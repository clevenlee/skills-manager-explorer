/**
 * 契约漂移检查，比较内存生成结果与已提交 YAML，防止 API、Mock 和文档分叉。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:30:00
 */
import { readFile } from "node:fs/promises";

import { openApiOutputPath, serializeOpenApi } from "./generate-openapi";

const committed = await readFile(openApiOutputPath, "utf8").catch(() => "");
if (committed !== serializeOpenApi()) {
  console.error("OpenAPI 生成物已漂移，请运行 bun run openapi:generate。");
  process.exit(1);
}

console.info("OpenAPI 生成物与 Zod 契约一致。");
