# 技能管家浏览器 - 智能体入口

> 仓库级地图。AI 编程前必读；本文件不承载实现细节，项目专属事实请写入 `docs/project-specs/` 或对应模块文档。

## 1. 项目定位

- 中文名：技能管家浏览器
- 英文名（目录名）：`skills-manager-explorer`

- Bun 本地全栈应用：Vue 网页 + Hono 本地服务 + `bun:sqlite`。
- `skills`、`scenarios` 只读；唯一写入范围是 `scenario_skills` 中单个 Skill 的场景归属。

## 3. 必读规则

- 产品边界先读 `docs/modules/skills-manager-explorer/prd/skills-manager-explorer-prd-1.0.md`。
- 技术、API 与数据边界先读 `docs/modules/skills-manager-explorer/spec/skills-manager-explorer-spec-1.0.md` 和生成 OpenAPI。
- 不使用 Node.js 运行时，不新增场景管理、Skill 管理、远程监听或任意 SQL。
- 自动化写测试只能使用 `tests/fixtures/` 创建的隔离数据库。

## 4. 文档目录与 owner

| 目录                     | 职责                                                                    | owner |
| ------------------------ | ----------------------------------------------------------------------- | ----- |
| `AGENTS.md`              | 仓库级地图，AI 与人类共同入口                                           | 仓库  |
| `README.md`              | 人类读者的一句话定位                                                    | 仓库  |
| `.env.development.agent` | 智能体开发专用环境变量模板；应用运行配置见 `.env.sample`                | 仓库  |
| `docs/project-specs/`    | 全局项目事实、技术栈、模块清单、验证入口                                | 仓库  |
| `docs/modules/<module>/` | 业务模块文档（按需创建：exec-plans、openapi、review、test、handoff 等） | 模块  |
| `docs/scripts/`          | 跨模块复用的全局脚本（按需创建）                                        | 仓库  |

> 业务模块目录在 PRD/执行计划落地后按 `docs/modules/<kebab-case>/` 创建；未实际承载内容前不预建空目录。

## 5. 启动入口

- 安装：`bun install --frozen-lockfile`
- 开发：`bun run dev`
- 生产：`bun run build && bun run start`
- 单文件：`bun run package`

## 6. 验证入口

- 全量门禁：`bun run verify`
- 覆盖率：`bun run test:coverage`
- 浏览器：`bun run test:e2e`
- 契约：`bun run openapi:check && bun run openapi:lint`
- 提交前自查：AGENTS/文档 owner、必读规则是否一致；未跑项和剩余风险写入交付说明。

## 7. 改动前必须确认

- 是否需要同步 `docs/project-specs/overview.md`、`docs/project-specs/module-inventory.md` 或对应模块文档。
