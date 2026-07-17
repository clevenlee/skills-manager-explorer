/**
 * 集合比对路由，把校验后的操作数交给纯集合与目录服务并返回统一分页结果。
 * 作者：NDP Coding
 * 日期：2026-07-17 11:50:00
 */
import type { OpenAPIHono } from "@hono/zod-openapi";

import { comparisonRoute } from "@/shared/contracts/comparison";
import { compareSkills } from "../services/comparison-service";

type Bindings = { Variables: { requestId: string } };
export function registerComparisonRoute(
  app: OpenAPIHono<Bindings>,
  databasePath: string,
): void {
  app.openapi(comparisonRoute, (context) => {
    const input = context.req.valid("json");
    const result = compareSkills(databasePath, input);
    return context.json(
      {
        data: {
          leftTotal: result.leftTotal,
          rightTotal: result.rightTotal,
          counts: result.counts,
          items: result.items,
        },
        meta: {
          requestId: context.get("requestId"),
          page: input.page,
          pageSize: input.pageSize,
          total: result.total,
        },
      },
      200,
    );
  });
}
