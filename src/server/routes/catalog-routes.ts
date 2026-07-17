/**
 * 只读目录路由注册器，将已校验查询映射到概览、来源、场景与 Skill 服务。
 * 作者：NDP Coding
 * 日期：2026-07-17 11:40:00
 */
import type { OpenAPIHono } from "@hono/zod-openapi";

import {
  overviewRoute,
  scenariosRoute,
  skillDetailRoute,
  skillsRoute,
  sourcesRoute,
} from "@/shared/contracts/catalog";
import {
  getOverview,
  getSkillDetail,
  listScenarios,
  listSkills,
  listSources,
} from "../services/catalog-service";

type Bindings = { Variables: { requestId: string } };
export function registerCatalogRoutes(
  app: OpenAPIHono<Bindings>,
  databasePath: string,
): void {
  app.openapi(overviewRoute, (context) =>
    context.json(
      {
        data: getOverview(databasePath),
        meta: { requestId: context.get("requestId") },
      },
      200,
    ),
  );
  app.openapi(sourcesRoute, (context) => {
    const query = context.req.valid("query");
    const result = listSources(databasePath, query);
    return context.json(
      {
        data: result.items,
        meta: {
          requestId: context.get("requestId"),
          page: query.page,
          pageSize: query.pageSize,
          total: result.total,
        },
      },
      200,
    );
  });
  app.openapi(scenariosRoute, (context) => {
    const query = context.req.valid("query");
    const result = listScenarios(databasePath, query);
    return context.json(
      {
        data: result.items,
        meta: {
          requestId: context.get("requestId"),
          page: query.page,
          pageSize: query.pageSize,
          total: result.total,
        },
      },
      200,
    );
  });
  app.openapi(skillsRoute, (context) => {
    const query = context.req.valid("query");
    const result = listSkills(databasePath, query);
    return context.json(
      {
        data: result.items,
        meta: {
          requestId: context.get("requestId"),
          page: query.page,
          pageSize: query.pageSize,
          total: result.total,
        },
      },
      200,
    );
  });
  app.openapi(skillDetailRoute, (context) =>
    context.json(
      {
        data: getSkillDetail(databasePath, context.req.valid("param").skillId),
        meta: { requestId: context.get("requestId") },
      },
      200,
    ),
  );
}
