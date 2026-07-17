# 技能管家浏览器 OpenAPI

本目录的 `skills-manager-browser-local-openapi.yaml` 由共享 Zod 契约生成，禁止手工修改。

- 重新生成：`bun run openapi:generate`
- 规范检查：`bun run openapi:lint`
- 漂移检查：`bun run openapi:check`
- 启动 Prism：`bun run mock`

Prism 是页面并行开发的契约替身，不维护第二份 JSON Mock。正式开发默认由 Vite 将 `/api` 转发到 Bun 本地服务。
