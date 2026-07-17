/**
 * 可公开领域错误，只允许规格内稳定错误码穿过统一错误处理边界。
 * 作者：NDP Coding
 * 日期：2026-07-17 11:40:00
 */
export class DomainError extends Error {
  readonly code: string;
  readonly status: 400 | 404 | 409 | 422 | 503;
  readonly details: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    status: 400 | 404 | 409 | 422 | 503,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
