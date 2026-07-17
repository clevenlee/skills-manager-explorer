/**
 * 状态路由注册器，把状态服务结果封装为统一响应并复用 OpenAPI 路由定义。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:40:00
 */
import type { OpenAPIHono } from "@hono/zod-openapi";

import { statusRoute } from "@/shared/contracts/status";
import { getApplicationStatus } from "../services/application-status-service";

type StatusRouteBindings = {
  Variables: { requestId: string };
};

export function registerStatusRoute(
  app: OpenAPIHono<StatusRouteBindings>,
  databasePath: string,
): void {
  app.openapi(statusRoute, (context) =>
    context.json(
      {
        data: getApplicationStatus(databasePath),
        meta: { requestId: context.get("requestId") },
      },
      200,
    ),
  );
}
