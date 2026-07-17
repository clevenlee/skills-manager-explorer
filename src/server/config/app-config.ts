/**
 * 服务启动配置边界，集中校验环境变量并拒绝非回环监听与相对数据库路径。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:20:00
 */
import { z } from "zod";

const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1"]);

const appConfigSchema = z.object({
  SKILLS_MANAGER_DB: z
    .string()
    .min(1)
    .refine((path) => path.startsWith("/"), {
      message: "SKILLS_MANAGER_DB 必须是绝对路径",
    }),
  HOST: z
    .string()
    .default("127.0.0.1")
    .refine((host) => loopbackHosts.has(host), {
      message: "HOST 只允许本机回环地址",
    }),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4173),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type AppConfig = {
  databasePath: string;
  host: string;
  port: number;
  logLevel: "debug" | "info" | "warn" | "error";
};

export function parseAppConfig(
  env: Record<string, string | undefined>,
): AppConfig {
  const parsed = appConfigSchema.parse(env);
  return {
    databasePath: parsed.SKILLS_MANAGER_DB,
    host: parsed.HOST,
    port: parsed.PORT,
    logLevel: parsed.LOG_LEVEL,
  };
}
