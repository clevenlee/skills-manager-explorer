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
| `README.md`              | 人类读者的一句话定位（中文版，双语同步源）                              | 仓库  |
| `README.en-US.md`        | `README.md` 的英文翻译版（由本仓库的双语 README 同步规则自动维护）      | 仓库  |
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

### 6.1 E2E / Playwright 执行边界

- 默认不得执行 E2E、Playwright 或 `bun run test:e2e`；常规功能开发、缺陷修复、重构和交付验证均只运行与改动相称的单元测试、集成测试、静态检查和构建。
- 只有满足下列任一条件时，才允许执行 E2E / Playwright：
  1. 正在进行重大版本升级或影响核心用户流程的重大升级；
  2. 已批准的 plan 中明确列出 E2E / Playwright 测试计划；
  3. 人类在当前任务中明确要求执行。
- 即使 plan 已明确列出 E2E / Playwright，也不得自动执行。必须先询问人类选择：立即由当前智能体执行、由人类安排其他智能体执行，或另选时机执行；得到选择前保持未执行状态。
- 人类在当前任务中已经明确要求执行时，无需重复询问。
- `bun run verify` 不代表授权追加 E2E / Playwright。交付说明应如实标记 E2E / Playwright 是否执行以及未执行原因。

## 7. 改动前必须确认

- 是否需要同步 `docs/project-specs/overview.md`、`docs/project-specs/module-inventory.md` 或对应模块文档。
- 是否触发了 README 翻译同步（见下）。

## 8. 双语 README 同步规则

- `README.md`（中文）是项目主页唯一来源；`README.en-US.md`（英文）由其翻译而来，互链。
- 任何对 `README.md` 的**章节级**改动（新增 / 删除 / 重命名 h2 章节，或新增关键 feature / 命令 / 端口）必须在**同一次提交**中同步翻译到 `README.en-US.md`，维持：
  1. 同样的 h1（"Skills Manager Explorer"）；
  2. 同样的 h2 章节集合（允许 EN 额外加 EN-only 元章节，如 "Documentation sync"）；
  3. 同样的功能描述、命令、端口、仓库路径与产品定位措辞。
- 兜底闸门：`bun run readme:check`（已接入 `bun run verify`）。当 EN 缺译时，构建会失败并打印缺失章节。
- 截图占位符、链接、prism / bun 等品牌专名不翻译；保留原文。
- 当改动仅是错别字、格式微调、文案打磨且不影响结构或功能列表时，可在中文版沉淀后单独提交 EN 同步。
