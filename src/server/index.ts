/**
 * Bun 本地服务入口，仅允许绑定回环地址，避免本地数据库能力暴露到网络。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:05:00
 */
import { createApp } from "./app";
import { parseAppConfig } from "./config/app-config";

const config = parseAppConfig(process.env);
const app = createApp(config.databasePath);

Bun.serve({ hostname: config.host, port: config.port, fetch: app.fetch });

console.info(
  `Skills Manager Explorer local server listening on http://${config.host}:${config.port}`,
);
