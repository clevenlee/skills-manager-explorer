/**
 * 只读目录路由注册器，将已校验查询映射到概览、来源、场景、Skill 与工作区服务。
 * 1.0.4 新增：工作区列表 / 工作区 Skill / 工作区场景。
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
  workspaceScenariosRoute,
  workspaceSkillsRoute,
  workspacesRoute,
} from "@/shared/contracts/catalog";
import { openReadDatabase } from "../database/open-database";
import {
  getOverview,
  getSkillDetail,
  listScenarios,
  listSkills,
  listSources,
} from "../services/catalog-service";
import {
  enabledSkillIdsInTool,
  listWorkspaces,
} from "../services/workspace-service";

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

  // 1.0.4：工作区
  app.openapi(workspacesRoute, (context) =>
    context.json(
      {
        data: listWorkspaces(databasePath),
        meta: { requestId: context.get("requestId") },
      },
      200,
    ),
  );
  app.openapi(workspaceSkillsRoute, (context) => {
    const name = context.req.valid("param").name;
    const query = context.req.valid("query");
    const database = openReadDatabase(databasePath);
    try {
      const { skillIds } = enabledSkillIdsInTool(database, name);
      const all = listSkills(databasePath, {
        page: 1,
        pageSize: 100,
        sort: "name",
        order: "asc",
      });
      const items = all.items.filter((s) => skillIds.has(s.id));
      const start = (query.page - 1) * query.pageSize;
      return context.json(
        {
          data: items.slice(start, start + query.pageSize),
          meta: {
            requestId: context.get("requestId"),
            page: query.page,
            pageSize: query.pageSize,
            total: items.length,
          },
        },
        200,
      );
    } finally {
      database.close();
    }
  });
  app.openapi(workspaceScenariosRoute, (context) => {
    const name = context.req.valid("param").name;
    const database = openReadDatabase(databasePath);
    try {
      const { skillIds } = enabledSkillIdsInTool(database, name);
      // 收集每个 scenario 关联的 skill，找至少有一个 skill 在该工作区启用。
      const allSkillLinks = listSkills(databasePath, {
        page: 1,
        pageSize: 100,
        sort: "name",
        order: "asc",
      }).items;
      const scenariosInWorkspace = new Set<string>();
      for (const skill of allSkillLinks) {
        if (!skillIds.has(skill.id)) continue;
        for (const s of skill.scenarios) scenariosInWorkspace.add(s.id);
      }
      const all = listScenarios(databasePath, {
        page: 1,
        pageSize: 100,
        sort: "sortOrder",
        order: "asc",
      });
      const items = all.items.filter((s) => scenariosInWorkspace.has(s.id));
      return context.json(
        { data: items, meta: { requestId: context.get("requestId") } },
        200,
      );
    } finally {
      database.close();
    }
  });
}
