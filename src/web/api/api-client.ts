/**
 * 前端统一 API 客户端，解析成功与错误包络并为页面保留请求标识。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:55:00
 */
import type { ZodType } from "zod";

type ErrorEnvelope = {
  error: { code: string; message: string; details: Record<string, unknown> };
  meta?: { requestId?: string };
};

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;

  constructor(
    message: string,
    code: string,
    status: number,
    requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export async function apiRequest<T>(
  path: string,
  schema: ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = body as ErrorEnvelope | null;
    throw new ApiError(
      error?.error.message || "本地服务暂时无法完成请求。",
      error?.error.code || "NETWORK_ERROR",
      response.status,
      error?.meta?.requestId,
    );
  }
  return schema.parse(body);
}
