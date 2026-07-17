/**
 * 应用状态契约，描述数据库可用性与写入能力且不暴露本地绝对路径。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:30:00
 */
import { createRoute, z } from "@hono/zod-openapi";

import { errorResponse } from "./errors";

export const databaseStateSchema = z
  .enum(["ready", "missing", "incompatible", "unavailable"])
  .openapi("DatabaseState");

export const applicationStatusSchema = z
  .object({
    database: z
      .object({
        state: databaseStateSchema.openapi({ example: "ready" }),
        writable: z.boolean().openapi({ example: true }),
        label: z.string().openapi({ example: "skills-manager.db" }),
        issues: z.array(z.string()).openapi({ example: [] }),
      })
      .strict(),
  })
  .strict()
  .openapi("ApplicationStatus");

export const statusEnvelopeSchema = z
  .object({
    data: applicationStatusSchema,
    meta: z
      .object({
        requestId: z
          .string()
          .uuid()
          .openapi({ example: "8d59b246-5e62-4a2e-bf67-2579a456a882" }),
      })
      .strict(),
  })
  .strict()
  .openapi("ApplicationStatusEnvelope");

export const statusRoute = createRoute({
  method: "get",
  path: "/api/v1/status",
  operationId: "getApplicationStatus",
  tags: ["Application"],
  summary: "获取本地数据库状态",
  responses: {
    200: {
      description: "数据库连接、结构兼容和写入能力状态",
      content: { "application/json": { schema: statusEnvelopeSchema } },
    },
    400: errorResponse("请求不合法"),
  },
});

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type StatusEnvelope = z.infer<typeof statusEnvelopeSchema>;
