/**
 * Hono 应用组合根，统一设置请求标识、安全响应头与不泄露内部信息的错误结构。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:40:00
 */
import { OpenAPIHono } from "@hono/zod-openapi";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";

import { registerAnalysisRoute } from "./routes/analysis-route";
import { registerAssignmentRoute } from "./routes/assignment-route";
import { registerCatalogRoutes } from "./routes/catalog-routes";
import { registerComparisonRoute } from "./routes/comparison-route";
import { registerStatusRoute } from "./routes/status-route";
import { DomainError } from "./services/domain-error";
import { registerStaticRoutes } from "./static-assets";

type AppBindings = { Variables: { requestId: string } };

export function createApp(databasePath: string): OpenAPIHono<AppBindings> {
  const app = new OpenAPIHono<AppBindings>({
    defaultHook: (result, context) => {
      if (result.success) return;
      return context.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "请求参数不合法。",
            details: {
              issues: result.error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
              })),
            },
          },
          meta: { requestId: context.get("requestId") },
        },
        400,
      );
    },
  });
  app.use("*", requestId());
  app.use("*", secureHeaders());

  registerStatusRoute(app, databasePath);
  registerCatalogRoutes(app, databasePath);
  registerComparisonRoute(app, databasePath);
  registerAssignmentRoute(app, databasePath);
  registerAnalysisRoute(app, databasePath);
  registerStaticRoutes(app);

  app.notFound((context) =>
    context.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "请求的本地接口不存在。",
          details: {},
        },
        meta: { requestId: context.get("requestId") },
      },
      404,
    ),
  );
  app.onError((error, context) => {
    if (error instanceof DomainError) {
      return context.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
          meta: { requestId: context.get("requestId") },
        },
        error.status,
      );
    }
    const message = error.message.toLocaleLowerCase();
    if (
      message.includes("database_file_not_found") ||
      message.includes("unable to open database")
    ) {
      return context.json(
        {
          error: {
            code: "DATABASE_UNAVAILABLE",
            message: "数据库不可用，请检查 .env 配置与文件权限。",
            details: {},
          },
          meta: { requestId: context.get("requestId") },
        },
        503,
      );
    }
    if (
      message.includes("no such table") ||
      message.includes("no such column")
    ) {
      return context.json(
        {
          error: {
            code: "DATABASE_SCHEMA_INCOMPATIBLE",
            message: "数据库结构与当前版本不兼容。",
            details: {},
          },
          meta: { requestId: context.get("requestId") },
        },
        422,
      );
    }
    console.error("本地服务发生未预期错误", {
      requestId: context.get("requestId"),
      name: error.name,
    });
    return context.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "本地服务暂时无法完成请求。",
          details: {},
        },
        meta: { requestId: context.get("requestId") },
      },
      500,
    );
  });
  return app;
}
