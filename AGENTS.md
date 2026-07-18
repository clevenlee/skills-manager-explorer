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

- 全量门禁（仅在 6.2 允许时执行）：`bun run verify`
- 覆盖率：`bun run test:coverage`
- 浏览器（仅在 6.1 取得人类授权后执行）：`bun run test:e2e`
- 契约：`bun run openapi:check && bun run openapi:lint`
- 提交前自查：AGENTS/文档 owner、必读规则是否一致；未跑项和剩余风险写入交付说明。

### 6.1 E2E / Playwright 执行边界

- 默认不得执行 E2E、Playwright、`bun run test:e2e` 或其他需要启动、控制浏览器的测试；常规功能开发、缺陷修复和重构不自动运行浏览器测试。
- 只有重大升级，或已批准的 plan 明确列出 E2E / Playwright 测试计划时，才可把浏览器测试作为候选验证步骤；候选步骤不等于执行授权。
- plan 执行到 E2E / Playwright 步骤时必须暂停并询问人类，由人类选择：
  1. 立即由当前智能体执行；
  2. 由人类安排其他智能体执行；
  3. 跳过当前步骤，另选时机执行。
- 只有人类明确选择“立即由当前智能体执行”或在当前执行节点给出等价指令后，当前智能体才可运行浏览器测试；得到选择前保持未执行状态。即使 plan 已获批准，也不得跳过本次询问。
- `bun run verify`、全量测试要求或通用“验证”指令都不代表 E2E / Playwright 授权。交付说明必须如实标记浏览器测试是否执行及未执行原因。

### 6.2 纯脚本测试与测试范围

- JUnit、`bun:test` 以及其他无需浏览器、可纯脚本运行的单元测试、集成测试和脚本测试，可按任务风险与复杂度决定是否执行；本条不改变本项目仅使用 Bun、不使用 Node.js 运行时的技术边界。
- 简单、低风险且改动范围明确的任务，默认不要求运行测试；可仅做必要的静态检查，或在无需验证时不运行任何测试。
- 功能复杂、风险较高，或人类明确要求测试时，应运行与改动相称的纯脚本测试并记录结果。
- 默认只测试直接涉及的模块、测试文件和受影响路径。仅在计划文件明确要求、人类明确要求全量测试，或改动复杂且涉及大量文件、多个模块或大量接口修订时，才执行全量测试、全量覆盖率或 `bun run verify`。
- 无论执行范围大小，自动化写测试都只能使用 `tests/fixtures/` 创建的隔离数据库；交付说明应列出已执行和未执行的测试范围。

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
