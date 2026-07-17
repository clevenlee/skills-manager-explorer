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
  return registry.getOpenAPI31Document({
    openapi: "3.1.0",
    info: {
      title: "技能管家浏览器本地 API",
      version: "1.0.0",
      description:
        "只在本机回环地址提供的 Skills Manager 数据浏览与场景归属接口。",
      license: {
        name: "Proprietary",
        url: "https://choosealicense.com/no-permission/",
      },
    },
    servers: [{ url: "http://127.0.0.1:4173", description: "本地服务" }],
    security: [],
  });
}
