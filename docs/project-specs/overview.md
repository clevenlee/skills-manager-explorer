# 技能管家浏览器 - 项目概览

> 长期项目事实。技术栈、端别、关键入口变化时同步更新；不要把临时决策、一次性实现细节写在这里。

## 项目定位

- 中文名：技能管家浏览器
- 英文名（目录名）：`skills-manager-explorer`

## 技术栈

- 运行时与包管理：Bun 1.3.14 初始化基线。
- 语言：TypeScript 6.0.x；TypeScript 7 待 `vue-tsc` 正式兼容后独立升级。
- 前端：Vue 3、Vite、Ant Design Vue、Vue Router。
- 本地服务：Hono。
- 数据库访问：Bun 原生 `bun:sqlite`，不使用 ORM 或数据库迁移。
- 契约：Zod 为定义源，生成并提交 OpenAPI YAML，Prism 使用该契约提供 Mock。
- 测试：`bun:test`、Playwright。

> 精确依赖版本以首次 `package.json` 和 `bun.lock` 落地为准；技术规格见 `docs/modules/skills-manager-explorer/spec/skills-manager-explorer-spec-1.0.md`。

## 文档 owner

| 目录                     | 职责                                                | owner |
| ------------------------ | --------------------------------------------------- | ----- |
| `AGENTS.md`              | 仓库级入口、必读规则、启动/验证入口                 | 仓库  |
| `docs/project-specs/`    | 项目长期事实、技术栈、模块清单                      | 仓库  |
| `docs/modules/<module>/` | 业务模块 PRD、执行计划、契约、review、test、handoff | 模块  |
| `docs/scripts/`          | 跨模块复用的全局脚本                                | 仓库  |
| `docs/generated/`        | 全局级别重要生成物                                  | 仓库  |

## 启动入口

- 应用运行配置：复制 `.env.sample` 为 `.env` 后填写；`.env.development.agent` 仅保留智能体开发专用变量。
- 开发：`bun run dev`；网页端口 15173，本地服务端口 14173。
- 生产：`bun run build && bun run start`，前端和 API 同源。
- macOS 单文件：`bun run package`。

## 验证入口

- 质量门禁：`bun run verify`。
- 覆盖率：`bun run test:coverage`。
- 浏览器：`bun run test:e2e`。
- 契约：`bun run openapi:check && bun run openapi:lint`。

## 端别边界

- 产品是运行在用户本机的应用端 Web 界面与本地服务，不包含远程后端。
- 本地服务只监听回环地址，通过 `SKILLS_MANAGER_DB` 读取用户自己的 Skills Manager SQLite 数据库。
- `skills`、`scenarios` 只读；唯一允许写入的是 `scenario_skills` 中单个 Skill 的场景归属。
- 不提供账号、鉴权、云同步、远程访问、场景管理或 Skill 安装更新能力。

## 当前状态

- PRD 1.0、技术规格与执行计划已完成实施。
- 概览、来源、场景、Skill、集合比对和单个 Skill 场景归属调整均已交付。
- 验收证据见模块 `test/` 目录。
