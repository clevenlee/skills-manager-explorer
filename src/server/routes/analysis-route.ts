/**
 * 分析路由注册器。1.0.6 起：工作区 Skill 错配清单。
 * 作者：NDP Coding
 * 日期：2026-07-18 09:30:00
 */
import type { OpenAPIHono } from "@hono/zod-openapi";

import { workspaceSkillMismatchsRoute } from "@/shared/contracts/analysis";
import { listWorkspaceSkillMismatches } from "../services/analysis-service";

type Bindings = { Variables: { requestId: string } };
export function registerAnalysisRoute(
  app: OpenAPIHono<Bindings>,
  databasePath: string,
): void {
  app.openapi(workspaceSkillMismatchsRoute, (context) =>
    context.json(
      {
        data: listWorkspaceSkillMismatches(databasePath),
        meta: { requestId: context.get("requestId") },
      },
      200,
    ),
  );
}
