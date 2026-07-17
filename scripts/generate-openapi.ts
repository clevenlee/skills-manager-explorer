/**
 * 从共享 Zod 契约生成确定性的 OpenAPI YAML，生成物不得手工修改。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:30:00
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { stringify } from "yaml";

import { buildOpenApiDocument } from "@/shared/contracts/openapi";

export const openApiOutputPath = resolve(
  "docs/modules/skills-manager-explorer/openapi/skills-manager-explorer-local-openapi.yaml",
);

export function serializeOpenApi(): string {
  return `# 此文件由 bun run openapi:generate 生成，请勿手工修改。\n${stringify(buildOpenApiDocument(), { lineWidth: 100 })}`;
}

if (import.meta.main) {
  await mkdir(dirname(openApiOutputPath), { recursive: true });
  await writeFile(openApiOutputPath, serializeOpenApi(), "utf8");
  console.info(`已生成 ${openApiOutputPath}`);
}
