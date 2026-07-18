/**
 * 场景归属路由，唯一暴露写能力的 HTTP 入口并强制 expected 集合校验。
 * 1.0.3 起新增 bulkAddSkillScenarios：POST `/api/v1/skills/bulk-add-scenarios`。
 * 作者：NDP Coding
 * 日期：2026-07-17 11:50:00
 */
import type { OpenAPIHono } from "@hono/zod-openapi";

import {
  assignmentRoute,
  bulkAddSkillScenariosRoute,
} from "@/shared/contracts/assignment";
import {
  bulkAddSkillScenarios,
  replaceSkillScenarios,
} from "../services/assignment-service";

type Bindings = { Variables: { requestId: string } };
export function registerAssignmentRoute(
  app: OpenAPIHono<Bindings>,
  databasePath: string,
): void {
  app.openapi(assignmentRoute, (context) =>
    context.json(
      {
        data: replaceSkillScenarios(
          databasePath,
          context.req.valid("param").skillId,
          context.req.valid("json"),
        ),
        meta: { requestId: context.get("requestId") },
      },
      200,
    ),
  );
  app.openapi(bulkAddSkillScenariosRoute, (context) =>
    context.json(
      {
        data: bulkAddSkillScenarios(databasePath, context.req.valid("json")),
        meta: { requestId: context.get("requestId") },
      },
      200,
    ),
  );
}
