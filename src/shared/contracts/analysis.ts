/**
 * 分析契约：1.0.6 起第一类"工作区 Skill 错配"清单。
 * 字段：skill（SkillSummary）+ scenario（id+name）+ workspace（tool 名称）。
 * 作者：NDP Coding
 * 日期：2026-07-18 09:30:00
 */
import { createRoute, z } from "@hono/zod-openapi";

import { errorResponse } from "./errors";
import { skillSummarySchema } from "./catalog";

const mismatchScenarioSchema = z
  .object({ id: z.string(), name: z.string() })
  .strict()
  .openapi("MismatchScenario");

export const workspaceSkillMismatchSchema = z
  .object({
    skill: skillSummarySchema,
    scenario: mismatchScenarioSchema,
    workspace: z.string().describe("工具名 / 工作区标识"),
  })
  .strict()
  .openapi("WorkspaceSkillMismatch");

export const workspaceSkillMismatchsEnvelopeSchema = z
  .object({
    data: z.array(workspaceSkillMismatchSchema),
    meta: z.object({ requestId: z.string() }).strict(),
  })
  .strict()
  .openapi("WorkspaceSkillMismatchsEnvelope");

export const workspaceSkillMismatchsRoute = createRoute({
  method: "get",
  path: "/api/v1/analyses/workspace-skill-mismatches",
  operationId: "listWorkspaceSkillMismatches",
  tags: ["Analysis"],
  summary:
    "Skill 已被设置到场景、场景已应用到工作区、但 Skill 未在工作区启用 的三元组清单",
  responses: {
    200: {
      description: "错配清单",
      content: {
        "application/json": { schema: workspaceSkillMismatchsEnvelopeSchema },
      },
    },
    422: errorResponse("数据库结构不兼容"),
  },
});

export type WorkspaceSkillMismatch = z.infer<
  typeof workspaceSkillMismatchSchema
>;
