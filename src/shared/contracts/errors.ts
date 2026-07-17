/**
 * API 错误契约，确保前端只接收稳定错误码、可读提示与安全细节。
 * 作者：NDP Coding
 * 日期：2026-07-17 11:25:00
 */
import { z } from "@hono/zod-openapi";

export const errorEnvelopeSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.string(), z.unknown()),
      })
      .strict(),
    meta: z.object({ requestId: z.string() }).strict(),
  })
  .strict()
  .openapi("ErrorEnvelope");

export const errorResponse = (description: string) => ({
  description,
  content: { "application/json": { schema: errorEnvelopeSchema } },
});
