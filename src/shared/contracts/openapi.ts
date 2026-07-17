/**
 * OpenAPI 文档注册入口，所有接口必须从共享 Zod 契约注册后生成评审产物。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:30:00
 */
import { OpenAPIHono } from "@hono/zod-openapi";

import { assignmentRoute } from "./assignment";
import {
  overviewRoute,
  scenariosRoute,
  skillDetailRoute,
  skillsRoute,
  sourcesRoute,
} from "./catalog";
import { comparisonRoute } from "./comparison";
import { statusRoute } from "./status";

export function buildOpenApiDocument(): ReturnType<
  OpenAPIHono["getOpenAPI31Document"]
> {
  const registry = new OpenAPIHono();
  for (const route of [
    statusRoute,
    overviewRoute,
    sourcesRoute,
    scenariosRoute,
    skillsRoute,
    skillDetailRoute,
    comparisonRoute,
    assignmentRoute,
  ]) {
    registry.openAPIRegistry.registerPath(route);
  }
  const document = registry.getOpenAPI31Document({
    openapi: "3.1.0",
    info: {
      title: "Skills Manager Explorer API",
      version: "1.0.0",
      description:
        "Local Skills Manager Explorer API for browsing, comparing, and adjusting scenario assignments on a Skills Manager SQLite database. / Skills Manager Explorer 本地 API：在本机回环地址提供 Skills Manager 数据浏览、比对与场景归属调整接口。",
      license: {
        name: "Proprietary",
        url: "https://choosealicense.com/no-permission/",
      },
    },
    servers: [
      { url: "http://127.0.0.1:4173", description: "Local service / 本地服务" },
    ],
    security: [],
  });
  // 登记双语言资源位置供前端 vue-i18n 与文档消费方使用；不在契约内校验。
  (document as unknown as Record<string, unknown>)["x-locale-resources"] = {
    default: "zh-CN",
    supported: ["zh-CN", "en-US"],
    sources: {
      "zh-CN": "src/web/i18n/locales/zh-CN.ts",
      "en-US": "src/web/i18n/locales/en-US.ts",
    },
    storageKey: "skillsManagerExplorer.locale",
  };
  return document;
}
