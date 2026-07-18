/**
 * Skill 集合比对契约，允许来源、场景或已启用工作区作为任一操作数并完整返回结果。
 * 作者：NDP Coding
 * 日期：2026-07-17 11:25:00
 */
import { createRoute, z } from "@hono/zod-openapi";

import { skillSummarySchema } from "./catalog";
import { errorResponse } from "./errors";

export const comparisonOperandSchema = z
  .object({
    type: z.enum(["source", "scenario", "workspace"]),
    id: z.string().min(1),
  })
  .strict()
  .openapi("ComparisonOperand");
export const comparisonInputSchema = z
  .object({
    left: comparisonOperandSchema,
    right: comparisonOperandSchema,
    result: z
      .enum(["common", "leftOnly", "rightOnly", "difference"])
      .default("difference"),
    q: z.string().max(200).optional(),
    sort: z.enum(["name", "updatedAt"]).default("name"),
    order: z.enum(["asc", "desc"]).default("asc"),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(0).max(100).default(0),
  })
  .strict()
  .openapi("SkillComparisonInput");
export const comparisonEnvelopeSchema = z
  .object({
    data: z
      .object({
        leftTotal: z.number().int(),
        rightTotal: z.number().int(),
        counts: z
          .object({
            common: z.number().int(),
            leftOnly: z.number().int(),
            rightOnly: z.number().int(),
            difference: z.number().int(),
          })
          .strict(),
        items: z.array(skillSummarySchema),
      })
      .strict(),
    meta: z
      .object({
        requestId: z.string(),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
      })
      .strict(),
  })
  .strict()
  .openapi("SkillComparisonEnvelope");
export const comparisonRoute = createRoute({
  method: "post",
  path: "/api/v1/skill-comparisons",
  operationId: "compareSkills",
  tags: ["Comparison"],
  summary: "比较两个来源或场景中的 Skill 集合",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: comparisonInputSchema } },
    },
  },
  responses: {
    200: {
      description: "比对计数与结果集合",
      content: { "application/json": { schema: comparisonEnvelopeSchema } },
    },
    400: errorResponse("请求或操作数不合法"),
    404: errorResponse("操作数不存在"),
  },
});
export type ComparisonInput = z.infer<typeof comparisonInputSchema>;
