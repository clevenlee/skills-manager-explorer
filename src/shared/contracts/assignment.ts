/**
 * 单个 Skill 场景归属替换契约，以 expected 集合实现乐观冲突保护。
 * 作者：NDP Coding
 * 日期：2026-07-17 11:25:00
 */
import { createRoute, z } from "@hono/zod-openapi";

import { skillScenarioSchema } from "./catalog";
import { errorResponse } from "./errors";

export const assignmentInputSchema = z
  .object({
    scenarioIds: z.array(z.string()).max(500),
    expectedScenarioIds: z.array(z.string()).max(500),
  })
  .strict()
  .openapi("SkillAssignmentInput");
export const assignmentEnvelopeSchema = z
  .object({
    data: z
      .object({
        scenarios: z.array(skillScenarioSchema),
        addedScenarioIds: z.array(z.string()),
        removedScenarioIds: z.array(z.string()),
      })
      .strict(),
    meta: z.object({ requestId: z.string() }).strict(),
  })
  .strict()
  .openapi("SkillAssignmentEnvelope");
const assignmentParamsSchema = z.object({
  skillId: z
    .string()
    .min(1)
    .openapi({ param: { name: "skillId", in: "path" } }),
});
export const assignmentRoute = createRoute({
  method: "put",
  path: "/api/v1/skills/{skillId}/scenarios",
  operationId: "replaceSkillScenarios",
  tags: ["Skills"],
  summary: "原子替换单个 Skill 的场景归属",
  request: {
    params: assignmentParamsSchema,
    body: {
      required: true,
      content: { "application/json": { schema: assignmentInputSchema } },
    },
  },
  responses: {
    200: {
      description: "更新后的归属与变更摘要",
      content: { "application/json": { schema: assignmentEnvelopeSchema } },
    },
    400: errorResponse("请求不合法"),
    404: errorResponse("Skill 或场景不存在"),
    409: errorResponse("归属冲突或数据库锁定"),
    503: errorResponse("数据库只读"),
  },
});
export type AssignmentInput = z.infer<typeof assignmentInputSchema>;

/** 批量把若干场景**加**入若干 Skill，不替换已有归属。 */
export const bulkAddSkillScenariosInputSchema = z
  .object({
    skillIds: z.array(z.string().min(1)).min(1).max(100),
    scenarioIds: z.array(z.string().min(1)).min(1).max(50),
  })
  .strict()
  .openapi("BulkAddSkillScenariosInput");
export const bulkAddSkillScenariosResultSchema = z
  .object({
    skillId: z.string(),
    name: z.string(),
    addedScenarioIds: z.array(z.string()),
    scenarios: z.array(skillScenarioSchema),
  })
  .strict()
  .openapi("BulkAddSkillScenariosResult");
export const bulkAddSkillScenariosEnvelopeSchema = z
  .object({
    data: z
      .object({
        results: z.array(bulkAddSkillScenariosResultSchema),
        skipped: z
          .array(z.object({ skillId: z.string(), name: z.string() }).strict())
          .describe("已包含全部目标场景、因此无新增的 Skill 列表"),
      })
      .strict(),
    meta: z.object({ requestId: z.string() }).strict(),
  })
  .strict()
  .openapi("BulkAddSkillScenariosEnvelope");
export const bulkAddSkillScenariosRoute = createRoute({
  method: "post",
  path: "/api/v1/skills/bulk-add-scenarios",
  operationId: "bulkAddSkillScenarios",
  tags: ["Skills"],
  summary: "批量把若干场景加到若干 Skill（不替换、不删除）",
  request: {
    body: {
      required: true,
      content: {
        "application/json": { schema: bulkAddSkillScenariosInputSchema },
      },
    },
  },
  responses: {
    200: {
      description: "逐 Skill 的添加结果与已跳过列表",
      content: {
        "application/json": { schema: bulkAddSkillScenariosEnvelopeSchema },
      },
    },
    400: errorResponse("请求不合法"),
    404: errorResponse("Skill 或场景不存在"),
    503: errorResponse("数据库只读"),
  },
});
export type BulkAddSkillScenariosInput = z.infer<
  typeof bulkAddSkillScenariosInputSchema
>;
