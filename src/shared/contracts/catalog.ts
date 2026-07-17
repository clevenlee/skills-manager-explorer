/**
 * 概览、来源、场景与 Skill 浏览契约，统一分页、筛选和详情字段。
 * 作者：NDP Coding
 * 日期：2026-07-17 11:25:00
 */
import { createRoute, z } from "@hono/zod-openapi";

import { errorResponse } from "./errors";

export const paginationQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  order: z.enum(["asc", "desc"]).default("asc"),
});

const paginationMetaSchema = z
  .object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int().nonnegative(),
  })
  .strict();
const requestMetaSchema = z.object({ requestId: z.string() }).strict();

export const overviewEnvelopeSchema = z
  .object({
    data: z
      .object({
        skills: z.number().int(),
        sources: z.number().int(),
        scenarios: z.number().int(),
        orphanSkills: z.number().int(),
        multiScenarioSkills: z.number().int(),
      })
      .strict(),
    meta: requestMetaSchema,
  })
  .strict()
  .openapi("OverviewEnvelope");

export const sourceSchema = z
  .object({
    id: z.string(),
    key: z.string(),
    name: z.string(),
    type: z.string(),
    externalUrl: z.string().url().nullable(),
    skillCount: z.number().int(),
    assignedSkillCount: z.number().int(),
    orphanSkillCount: z.number().int(),
  })
  .strict()
  .openapi("Source");
export const sourcesEnvelopeSchema = z
  .object({
    data: z.array(sourceSchema),
    meta: paginationMetaSchema.merge(requestMetaSchema),
  })
  .strict()
  .openapi("SourcesEnvelope");

export const scenarioSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    icon: z.string().nullable(),
    sortOrder: z.number().int(),
    createdAt: z.number().nullable(),
    updatedAt: z.number().nullable(),
    skillCount: z.number().int(),
  })
  .strict()
  .openapi("Scenario");
export const scenariosEnvelopeSchema = z
  .object({
    data: z.array(scenarioSchema),
    meta: paginationMetaSchema.merge(requestMetaSchema),
  })
  .strict()
  .openapi("ScenariosEnvelope");

export const skillScenarioSchema = z
  .object({ id: z.string(), name: z.string(), sortOrder: z.number().int() })
  .strict()
  .openapi("SkillScenario");
export const skillSummarySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    enabled: z.boolean(),
    status: z.string().nullable(),
    updateStatus: z.string().nullable(),
    source: sourceSchema
      .pick({ id: true, name: true, type: true, externalUrl: true })
      .nullable(),
    scenarios: z.array(skillScenarioSchema),
    createdAt: z.number().nullable(),
    updatedAt: z.number().nullable(),
  })
  .strict()
  .openapi("SkillSummary");
export const skillsEnvelopeSchema = z
  .object({
    data: z.array(skillSummarySchema),
    meta: paginationMetaSchema.merge(requestMetaSchema),
  })
  .strict()
  .openapi("SkillsEnvelope");

export const skillDetailSchema = skillSummarySchema
  .extend({
    sourceType: z.string().nullable(),
    sourceRef: z.string().nullable(),
    sourceRefResolved: z.string().nullable(),
    sourceSubpath: z.string().nullable(),
    sourceBranch: z.string().nullable(),
    sourceRevision: z.string().nullable(),
    remoteRevision: z.string().nullable(),
    centralPath: z.string().nullable(),
    contentHash: z.string().nullable(),
    lastCheckedAt: z.number().nullable(),
    lastCheckError: z.string().nullable(),
  })
  .strict()
  .openapi("SkillDetail");
export const skillDetailEnvelopeSchema = z
  .object({ data: skillDetailSchema, meta: requestMetaSchema })
  .strict()
  .openapi("SkillDetailEnvelope");

export const overviewRoute = createRoute({
  method: "get",
  path: "/api/v1/overview",
  operationId: "getOverview",
  tags: ["Catalog"],
  summary: "获取概览指标",
  responses: {
    200: {
      description: "概览指标",
      content: { "application/json": { schema: overviewEnvelopeSchema } },
    },
    422: errorResponse("数据库结构不兼容"),
  },
});
export const sourcesRoute = createRoute({
  method: "get",
  path: "/api/v1/sources",
  operationId: "listSources",
  tags: ["Catalog"],
  summary: "分页获取来源",
  request: {
    query: paginationQuerySchema.extend({
      sort: z.enum(["name", "skillCount"]).default("name"),
    }),
  },
  responses: {
    200: {
      description: "来源列表",
      content: { "application/json": { schema: sourcesEnvelopeSchema } },
    },
    400: errorResponse("查询参数不合法"),
  },
});
export const scenariosRoute = createRoute({
  method: "get",
  path: "/api/v1/scenarios",
  operationId: "listScenarios",
  tags: ["Catalog"],
  summary: "分页获取场景",
  request: {
    query: paginationQuerySchema.extend({
      sort: z.enum(["sortOrder", "name", "skillCount"]).default("sortOrder"),
    }),
  },
  responses: {
    200: {
      description: "场景列表",
      content: { "application/json": { schema: scenariosEnvelopeSchema } },
    },
    400: errorResponse("查询参数不合法"),
  },
});
export const skillsRoute = createRoute({
  method: "get",
  path: "/api/v1/skills",
  operationId: "listSkills",
  tags: ["Skills"],
  summary: "搜索与筛选 Skills",
  request: {
    query: paginationQuerySchema.extend({
      pageSize: z.coerce.number().int().min(0).max(100).default(0),
      sort: z
        .enum(["name", "createdAt", "updatedAt", "status"])
        .default("name"),
      sourceIds: z.string().optional(),
      scenarioIds: z.string().optional(),
      orphan: z.enum(["true", "false"]).optional(),
      multiScenario: z.enum(["true", "false"]).optional(),
    }),
  },
  responses: {
    200: {
      description: "Skill 列表",
      content: { "application/json": { schema: skillsEnvelopeSchema } },
    },
    400: errorResponse("查询参数不合法"),
  },
});
const skillIdParamsSchema = z.object({
  skillId: z
    .string()
    .min(1)
    .max(200)
    .openapi({ param: { name: "skillId", in: "path" } }),
});
export const skillDetailRoute = createRoute({
  method: "get",
  path: "/api/v1/skills/{skillId}",
  operationId: "getSkill",
  tags: ["Skills"],
  summary: "获取 Skill 全字段详情",
  request: { params: skillIdParamsSchema },
  responses: {
    200: {
      description: "Skill 详情",
      content: { "application/json": { schema: skillDetailEnvelopeSchema } },
    },
    404: errorResponse("Skill 不存在"),
  },
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type SkillSummary = z.infer<typeof skillSummarySchema>;
export type SkillDetail = z.infer<typeof skillDetailSchema>;
