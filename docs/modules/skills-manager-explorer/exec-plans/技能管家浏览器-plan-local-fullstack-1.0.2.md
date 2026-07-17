# 技能管家浏览器实施计划 1.0.2（国际化与系统命名规范）

## 1. 计划信息

| 项目         | 内容                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| 对应 PRD     | `../prd/skills-manager-explorer-prd-1.0.md`（不变）                                   |
| 对应技术规格 | `../spec/skills-manager-explorer-spec-1.0.md`（本计划落地后追加国际化与命名规范小节） |
| 配套 TODO    | `技能管家浏览器-todo-local-fullstack-1.0.2.md`                                        |
| 计划状态     | 待用户批准（pending APPROVAL）                                                        |
| 当前门禁     | PLAN；本计划落地后进入 IMPLEMENT                                                      |
| 实施方式     | 纵向切片 + 双语言回归；契约、UI、文案与文档同步                                       |

## 2. Overview

本计划把 1.0.1 已交付的本地全栈应用推进到“产品统一品牌 + 英文界面可用”的状态，并按用户要求把项目定位为上游 [https://github.com/xingkongliang/skills-manager](https://github.com/xingkongliang/skills-manager) 的浏览器扩展。

具体覆盖三件事：

1. **系统命名规范**。英文产品名统一为 `Skills Manager Explorer`；中文产品名按用户输入保留为 `Skills Manager 分析界面`（混合写法，存于 `zh-CN` locale 的 `app.title` 文案）。
2. **国际化（i18n）**。当前前端、后端启动日志、OpenAPI 元信息与文档全部为中文，本计划引入 `vue-i18n`，把所有面向用户的文案、错误提示、按钮、菜单、字段标签、空态/加载/错误态、确认弹窗、状态码中文展示统一抽取到 locale 资源；新增 `en-US` 与 `zh-CN` 两种语言，默认 `zh-CN`，可由用户在顶栏切换并持久化到 `localStorage`，并跟随浏览器 `Accept-Language` 回退。
3. **README 重写**。README 顶部明确说明本项目是 [https://github.com/xingkongliang/skills-manager](https://github.com/xingkongliang/skills-manager) 的浏览器扩展，介绍已实现功能、本地启动方式、单文件打包方式、日常使用方式与契约/Mock 入口。

本计划不修改 PRD 1.0 已划定的产品边界：不新增场景管理、Skill 安装/更新、批量归属、账号、云同步、远程访问或自定义 SQL；不引入 Pinia（仅当 i18n locale 状态确有跨页面共享需求时再评估）；不替换 Bun、Vue 3、Vite、Ant Design Vue、Hono、Zod、`bun:sqlite`、Playwright、`@hono/zod-openapi`、Redocly、Prism 等已锁定主版本。

## 3. Planning Basis

- PRD 1.0 仍为唯一产品事实，本计划不调整其范围与验收项。
- 技术规格 1.0 已实施通过；本计划落地后追加 §13“国际化与命名规范”小节，更新 §4 技术栈、§5 运行结构中关于 i18n 的描述，并刷新 §14 依赖表。
- 1.0.1 plan 全部 Checkpoint A–E 已通过；本计划在此基础上做叠加。
- 已有命名面（重命名决策**已批准**，见 §4 #1）：
  - 包名：`skills-manager-explorer`（原 `skills-manager-browser`，已在 1.0.2 落地时替换）。
  - 模块目录：`docs/modules/skills-manager-explorer/`（原 `docs/modules/skills-manager-browser/`，本计划批准时已 `mv`）。
  - 二进制产物：`dist/skills-manager-explorer`（跟随包名）。
  - OpenAPI 文件名：`skills-manager-explorer-local-openapi.yaml`。
  - 中文产品名：`技能管家浏览器`（替换为 `Skills Manager 分析界面`，按用户输入保留混合写法）。
  - 英文产品名：`Skills Manager Browser`（替换为 `Skills Manager Explorer`）。
  - `.env.sample` 中 `SKILLS_MANAGER_DB` 仍指向上游 Skills Manager SQLite 数据库，**不**修改。
  - 现有面向用户的中文文案硬编码在 `src/web/**`、`index.html`、`src/shared/contracts/openapi.ts` 与服务端 `console.info` 中（**已知清单见 §4 #3**）。
- 国际化技术现状：
  - 已有 `Intl.DateTimeFormat` 风格的日期与排序调用，但全部硬编码 `"zh-CN"`（`src/web/views/SkillDetailView.vue:68`、`src/web/views/SkillsView.vue:110`、`src/server/services/catalog-service.ts` 多处、`src/server/services/comparison-service.ts:118`），需在 i18n 落地时改为 `vue-i18n` 当前 locale。
  - 现有 `e2e/` 与 `tests/` 中含中文字面量断言，本计划要求在不改断言语义的前提下，扩展中英双语言 smoke。

## 4. Architecture Decisions

1. **包名 / 模块目录 / 二进制同步重命名**（用户已批准）。1.0.2 实施时一并完成：
   - `package.json` 的 `name`：`skills-manager-explorer`；
   - 模块目录：`docs/modules/skills-manager-explorer/`（本计划批准时已 `git mv`，下游任务直接基于新路径工作）；
   - OpenAPI 文件名：`docs/modules/skills-manager-explorer/openapi/skills-manager-explorer-local-openapi.yaml`，并同步更新 `src/shared/contracts/openapi.ts` 中所有与原名相关的元信息；
   - 单文件产物：`dist/skills-manager-explorer`；
   - `scripts/package*` 中所有 `--outfile` / `--target` 路径；
   - `tests/fixtures/`、`e2e/`、`playwright.config.ts` 中所有引用旧名的路径与命令；
   - `.env.sample` 中 `SKILLS_MANAGER_DB` 默认注释保持原样（指向上游 Skills Manager 数据库，与本产品名解耦）；
   - 仓库根目录路径 `ninerivers/ndp-tools/skills-manager-explorer/` **不**在 1.0.2 中重命名（属 IDE 工作区/git remote 范畴，另行评估）。
2. **i18n 库选型**。前端使用 `vue-i18n@9`（Vue 3 官方支持、Composition API、TypeScript 类型与 tree-shaking 友好）。不引入第二套 i18n 库或自研 message bundle。
3. **locale 资源组织**。在 `src/web/i18n/` 下维护：
   - `index.ts` 负责创建 i18n 实例、注册 locale、暴露 `setLocale`；
   - `locales/zh-CN.ts` 与 `locales/en-US.ts` 提供扁平 key 命名（`app.title`、`nav.overview`、`status.writable.true`、`errors.database_unavailable` 等），按模块（`app`、`nav`、`overview`、`sources`、`scenarios`、`skills`、`comparison`、`assignment`、`status`、`errors`、`common`）分组；
   - 类型层使用 `vue-i18n` 的 `Composer` 泛型，编译期校验 key 存在性。
4. **服务端策略**。本地服务返回的错误响应使用稳定 `code` 字段（`DATABASE_UNAVAILABLE` 等）并由前端翻译；`console.info` 等开发者日志保持中英文混排或仅英文（与上线后 CLI 用户群体一致），不进入 i18n 体系。
5. **OpenAPI 命名**。`info.title` 与 `info.description` 改为中英双语可读：`title: "Skills Manager Explorer API"`、`description` 中同时含中英说明；`x-locale-resources` 自定义扩展字段登记双语言文案，保留契约生成链路不变。
6. **默认语言与回退**。默认 `zh-CN`；启动时按以下顺序解析用户偏好：
   1. `localStorage.skillsManagerExplorer.locale`；
   2. `navigator.languages` 中第一个匹配 `zh-*` → `zh-CN`，匹配 `en-*` → `en-US`；
   3. 回退 `zh-CN`。
7. **持久化与跨会话**。`localStorage` key 固定为 `skillsManagerExplorer.locale`，写入后立即生效并刷新 `document.documentElement.lang`；切换语言不清空路由状态，URL 不强制携带语言参数。
8. **区域敏感计算**。日期格式、排序、缩写与千分位全部走当前 i18n locale；服务端排序仅在最终结果集使用 SQL `ORDER BY name COLLATE NOCASE` 兜底，详细规则以前端 locale 为主。
9. **不引入 Pinia**。`useLocale()` 组合式函数 + `localStorage` 足以覆盖跨页面共享；后续若出现真实跨页全局状态，再单独评估。
10. **README 与文档同步**。README 顶部新增“本项目是 `https://github.com/xingkongliang/skills-manager` 的浏览器扩展”一段，介绍功能、本地启动、单文件打包、日常使用、契约/Mock 入口；AGENTS.md、project-specs 与 `docs/modules/skills-manager-explorer/` 下所有面向用户的文档同步更新为新名称。

## 5. Dependency Graph

```text
Phase 1 命名与文档基线
  Task 1 系统显示名替换（AGENTS、project-specs、文档）
  Task 2 OpenAPI title/description、index.html 标题、控制台日志
  Task 3 README 重写（含 GitHub 扩展说明 + 功能 + 启动 + 使用）
        │
        ▼
Phase 2 i18n 基础设施
  Task 4 引入 vue-i18n + locale 资源骨架
  Task 5 语言切换器 UI + 持久化 + 浏览器回退
  Task 6 HTML lang/meta + OpenAPI 扩展字段
        │
        ▼
Phase 3 文案抽取（纵向切片，每页一组）
  Task 7 共享枚举与通用文案（common / errors / status）
  Task 8 布局 + 导航（AppLayout / App.vue / 路由 title）
  Task 9 概览 + 数据库状态页
  Task 10 来源 + 场景
  Task 11 Skills 列表 + 详情
  Task 12 比对
  Task 13 错误/空态/加载/确认弹窗统一收敛
        │
        ▼
Phase 4 区域感知
  Task 14 日期/时间 locale 化
  Task 15 排序 locale 化
  Task 16 数字格式（千分位、缩写、计数）
        │
        ▼
Phase 5 验证与回归
  Task 17 i18n key 完整性 + 缺失检测（lint 或单元测试）
  Task 18 E2E 中英 smoke + 视觉对比
  Task 19 契约/项目文档同步 + 决策笔记
  Task 20 bun run verify + e2e 全量回归
```

Phase 1 与 Phase 2 可并行启动；Phase 3 必须按页顺序完成以保证关键路径上每一页都对中英双语言可验收。Phase 4 不得先于 Phase 3 完成（会引用未抽取的 key）。

## 6. Implementation Phases

### Phase 1：命名与文档基线

- [ ] Task 1：把仓库级与模块级面向用户的文档统一为新名称，并完成包名 / OpenAPI 文件名 / 单文件产物路径的重命名。
  - 文档产品名替换：`AGENTS.md`、`README.md`（先暂存重写后的版本；按 Phase 2 的 i18n 落地后再做最终切换）、`docs/project-specs/overview.md`、`module-inventory.md`、技术规格、PRD 与现有 plan/todo。
  - 模块目录已重命名（`docs/modules/skills-manager-browser/` → `docs/modules/skills-manager-explorer/`，本计划批准时已执行；任务从新路径开始）。
  - OpenAPI 文件名与元信息：`docs/modules/skills-manager-explorer/openapi/skills-manager-explorer-local-openapi.yaml`；同步更新 `src/shared/contracts/openapi.ts` 中所有 `info.title` / `info.description` / `x-locale-resources` 引用。
  - `package.json` 的 `name` 替换为 `skills-manager-explorer`；`scripts/package*` 中 `--outfile` / `--target` 输出路径替换为 `dist/skills-manager-explorer`。
  - `tests/fixtures/`、`e2e/`、`playwright.config.ts` 中所有引用旧包名 / 旧产物的路径与命令替换。
  - 在 `docs/modules/skills-manager-explorer/handoff/技能管家浏览器-handoff-<日期>_<时间>.md` 登记“包名 / 模块目录 / 二进制同步重命名”决策及未重命名项（仓库根目录路径、`SKILLS_MANAGER_DB` 环境变量名）。
- [ ] Task 2：替换非 i18n 路径上的系统显示。
  - `index.html` `<title>` 改为 `Skills Manager Explorer`（zh-CN locale 下由 i18n 在 `mounted` 时改写）；
  - `src/shared/contracts/openapi.ts` 中 `title` 与 `description` 改为新名称；
  - `src/server/index.ts` 启动日志中产品名替换为 `Skills Manager Explorer`。
- [ ] Task 3：README 重写。
  - 顶部新增一段：项目是 [https://github.com/xingkongliang/skills-manager](https://github.com/xingkongliang/skills-manager) 的浏览器扩展，附原项目一句话定位。
  - “功能”节按 PRD 1.0 §8 与现有 1.0.1 verify 记录描述概览、来源、场景、Skill、比对、归属调整。
  - “本地启动”节：`bun install --frozen-lockfile`、`cp .env.sample .env`、`bun run dev`、网页 5173、API 4173。
  - “单文件打包”节：`bun run build && bun run package`，产物路径改为 `dist/skills-manager-explorer`。
  - “使用”节：概览 → 来源/场景 → Skill 列表 → 详情 → 归属调整 → 比对 的主路径，配图（按项目惯例可省略图，但需在 verify 中说明）。
  - “契约与 Mock”节：`bun run openapi:generate`、`openapi:lint`、`openapi:check`、`mock`，Prism 端口 4010。
  - “国际化”节（i18n 落地后填写）：默认 zh-CN、en-US 可切换、持久化策略。

#### Checkpoint A：命名与 README 一致

- [ ] AGENTS、project-specs、规格、PRD、OpenAPI title、index.html、控制台启动日志中的产品名一致。
- [ ] README 顶部明示本项目是 [https://github.com/xingkongliang/skills-manager](https://github.com/xingkongliang/skills-manager) 的浏览器扩展，且覆盖功能、启动、使用、契约/Mock、单文件打包、国际化的全部要点。
- [ ] `package.json` 的 `name`、`docs/modules/skills-manager-explorer/` 路径、OpenAPI 文件名、`scripts/package*` 输出路径已统一为 `skills-manager-explorer`；`tests/fixtures/` / `e2e/` / `playwright.config.ts` 中无遗留旧路径。
- [ ] handoff 记录已写，包含未重命名项（仓库根目录、`SKILLS_MANAGER_DB`）。

### Phase 2：i18n 基础设施

- [ ] Task 4：引入 `vue-i18n@9`，搭建 `src/web/i18n/`。
  - `index.ts` 创建 i18n 实例、注册 `zh-CN` 与 `en-US`、`fallbackLocale: 'zh-CN'`、启用 `legacy: false`、`missingWarn`/`fallbackWarn` 在开发环境开启、生产环境关闭；
  - `locales/zh-CN.ts` 与 `locales/en-US.ts` 提供分模块扁平 key；
  - 类型层：基于 `zh-CN` 反推类型并对 `en-US` 做 key 一致性检查。
- [ ] Task 5：实现语言切换器与持久化。
  - `src/web/composables/useLocale.ts`：暴露 `locale`、`setLocale`；
  - `src/web/components/LocaleSwitcher.vue`：顶栏下拉或图标按钮，aria-label 国际化；
  - 切换时同步 `localStorage.skillsManagerExplorer.locale` 与 `document.documentElement.lang`。
- [ ] Task 6：HTML lang/meta 与 OpenAPI 扩展。
  - `index.html` 静态 `<html lang="zh-CN">`，启动时按当前 locale 改写；
  - `src/shared/contracts/openapi.ts` 增加 `x-locale-resources` 扩展，登记双语言资源路径。

#### Checkpoint B：i18n 基础设施可用

- [ ] 切换语言后顶栏、页面标题、`<html lang>` 即时更新。
- [ ] `localStorage.skillsManagerExplorer.locale` 在刷新后保留。
- [ ] `bun run dev` 控制台无 i18n missing/fallback 警告（即使尚未抽取全部文案也要保证已有 key 不缺失）。

### Phase 3：文案抽取（纵向切片）

- [ ] Task 7：`common` / `errors` / `status` 模块。
  - 通用按钮（确认/取消/保存/返回/搜索/重置/清空条件/加载更多/分页）、表格列头、状态文案（启用/停用、可更新/最新/异常、连接成功/失败、只读、写入冲突等）、错误码中文展示。
- [ ] Task 8：布局 + 导航 + 路由 title。
  - `AppLayout.vue` 品牌、菜单、面包屑、空状态、aria-label、Drawer 标题；
  - `App.vue` 仅挂载路由即可，但要确保 `<router-view>` 外层被 i18n 包裹；
  - 路由 meta 增加 `titleKey`，在 `AppLayout` 或全局 `afterEach` 中更新 `document.title`。
- [ ] Task 9：概览 + 数据库状态页。
  - `OverviewView.vue` 卡片标题、副标题、点击提示、空态；
  - `StatusView.vue` 数据库路径、可写性、错误项、解决建议。
- [ ] Task 10：来源 + 场景。
  - 列表/详情、搜索占位、排序标签、空匹配、分页；
  - 规范化来源的展示名称（如“未知来源”）随 locale 切换。
- [ ] Task 11：Skills 列表 + 详情。
  - 列表筛选、排序、分页、视图切换、复制长字段的提示；
  - 详情全字段标签、所属场景、“调整场景归属”入口、二次确认、原子回滚提示。
- [ ] Task 12：比对。
  - 左右集合选择标签、四种视图名称、交换按钮、空集合提示、结果计数。
- [ ] Task 13：统一收敛错误/空态/加载/确认弹窗。
  - `RequestState.vue` 与所有页面级 loading/empty/error slot 文案；
  - `Modal.confirm`、`Popconfirm` 的中英文；
  - 保存中、成功、失败回滚的反馈。

#### Checkpoint C：所有页面中英双语言可验收

- [ ] 任意页面在 `en-US` 下：标题、菜单、按钮、字段标签、空态、错误提示全部为英文。
- [ ] 任意页面在 `zh-CN` 下：与 1.0.1 现状一致（不出现 “未翻译” 字样或空 key）。
- [ ] 同一 URL 在切换语言后仅更新文案，不出现路由抖动、滚动位置丢失或查询参数清空。

### Phase 4：区域感知

- [ ] Task 14：日期/时间 locale 化。
  - `src/web/views/SkillDetailView.vue:68`、`src/web/views/SkillsView.vue:110` 与所有 `new Date(...).toLocaleString("zh-CN")` 改为 `useLocale()` 提供的 `formatDate`。
- [ ] Task 15：排序 locale 化。
  - 前端兜底排序：`String.prototype.localeCompare(..., currentLocale)`；
  - 服务端：保留 `ORDER BY name COLLATE NOCASE`（不破坏现有契约），仅在结果集不空时透传；如有需要再在技术规格 §6/§7 标注。
- [ ] Task 16：数字格式。
  - 概览卡片、列表数量使用 `Intl.NumberFormat(currentLocale)` 渲染（中文千分位为 `,`，英文为 `,`；大数缩写统一用 `1.2K / 1.2k` 风格，文档化规则）。

#### Checkpoint D：区域感知一致

- [ ] 在 `en-US` 下 `2026-07-17T...` 显示为 `7/17/2026, ...`（浏览器默认）或项目自定义的 `MM/DD/YYYY HH:mm`。
- [ ] 在 `zh-CN` 下显示为 `2026/7/17 ...`。
- [ ] 来源/场景/Skill 排序在两种语言下结果稳定且符合各自语言习惯。

### Phase 5：验证与回归

- [ ] Task 17：i18n key 完整性检测。
  - `tests/unit/i18n-keys.test.ts`：校验 `en-US` 包含 `zh-CN` 全部 key；
  - `bun run verify` 失败时输出缺失 key 与所属模块。
- [ ] Task 18：E2E 中英 smoke + 视觉对比。
  - `e2e/i18n.spec.ts`：`zh-CN` 与 `en-US` 各跑一次主页 + 来源 + Skill 列表 + 比对核心路径；
  - 关键文本断言使用 `data-testid` 与 i18n key，**不**依赖硬编码中英文字面量。
- [ ] Task 19：契约/项目文档同步与决策笔记。
  - 更新 `docs/modules/skills-manager-explorer/spec/skills-manager-explorer-spec-1.0.md` §4/§5/§13/§14；
  - 在 `docs/modules/skills-manager-explorer/handoff/`（按需）追加命名/i18n 决策；
  - 同步 `docs/project-specs/overview.md`、`module-inventory.md`。
- [ ] Task 20：全量回归。
  - `bun run verify`、`bun run test:coverage`、`bun run test:e2e`、`bun run openapi:check && bun run openapi:lint`、`bun run mock` smoke；
  - macOS 单文件 `bun run package` smoke；
  - 在 `test/` 目录追加 `技能管家浏览器-verify-local-fullstack-1.0.2.md`。

#### Checkpoint E：1.0.2 可交付

- [ ] 上述所有 Checkpoint A–D 通过。
- [ ] `bun run verify`、覆盖率、E2E 在 macOS 通过。
- [ ] 中英两种语言在核心路径上无 i18n 缺失或回退警告。
- [ ] AGENTS、project-specs、规格、PRD、OpenAPI、README、契约生成物、单文件产物路径互相一致。
- [ ] `handoff/` 或 `test/` 记录了“包名/目录/二进制是否重命名”的最终决定及理由。

## 7. Vertical Slice Rules

每个纵向切片遵循以下顺序：

1. 先在 `locales/zh-CN.ts` 与 `locales/en-US.ts` 中补齐该切片所需 key（zh-CN 优先；en-US 初稿可与 zh-CN 同义，由后续校对统一润色）。
2. 替换页面中对应硬编码字符串为 `t('xxx')`，**先中文后英文**以保证可回滚。
3. 跑该切片相关单元/集成测试，再跑 `bun run verify`。
4. 跑 E2E 中英 smoke。

如切片需改变端点、字段、错误码、写边界或 PRD 范围，立即停止并先更新规格或 PRD 取得批准。

## 8. Verification Strategy

| 层次           | 每任务            | 每检查点                | 最终                         |
| -------------- | ----------------- | ----------------------- | ---------------------------- |
| 格式/lint/类型 | 改动相关命令      | `bun run verify`        | `bun run verify`             |
| 单元测试       | i18n key 与新模块 | 相关目录 + 覆盖率       | `bun test --coverage`        |
| 集成测试       | 修改的领域/API    | 修改的 fixture          | 全部通过并保存摘要           |
| API 契约       | i18n 不改契约     | `openapi:check`         | 全部通过                     |
| 浏览器         | E2E 中英 smoke    | 该阶段完整流程          | `bun run test:e2e`           |
| 真实数据库     | 禁止自动写入      | 人工只读 smoke          | 人工只读 smoke，记录未跑风险 |
| 单文件分发     | 不在此版验证      | `bun run package` smoke | 干净环境启动并访问主页       |

## 9. Risks and Mitigations

| 风险                                 | 影响                        | 等级 | 缓解措施                                                                |
| ------------------------------------ | --------------------------- | ---- | ----------------------------------------------------------------------- |
| 文案抽取不完整（漏抽/漏翻译）        | 切换语言后部分 key 回退或空 | 高   | Phase 5 强制 i18n key 完整性单测 + `missingWarn` 在 dev 阶段开启        |
| 排序/日期在英文下行为不符合英语习惯  | 比对结果错位                | 中   | Phase 4 单独验证；服务端保留 `COLLATE NOCASE` 兜底                      |
| 切换语言导致路由状态丢失或抖动       | 用户体验回退                | 中   | 切换仅改 `localStorage` + `<html lang>`，不触碰路由；写 Playwright 用例 |
| 包名/目录/二进制重命名遗漏           | 文档/产物不一致             | 中   | Checkpoint A 显式列出未重命名项；批准时显式选择                         |
| README 与 GitHub 上游项目说明不一致  | 用户预期偏差                | 低   | README 显式声明是“浏览器扩展”，避免与上游功能描述错位                   |
| 切换语言对 a11y/屏幕阅读器产生副作用 | 无障碍回归                  | 低   | `aria-label` 走 i18n，selftest 通过键盘可达性 + 屏幕阅读器抽查          |
| vue-i18n v9 与 Vue 3.5/Vite 8 不兼容 | 基础构建阻塞                | 低   | Task 4 锁版本并在 PR 描述中标注来源                                     |

## 10. Parallelization Opportunities

本计划默认单线程顺序实施；未经用户要求不启用多代理。若并行：

- Phase 1 中 Task 1（文档）与 Task 2（OpenAPI/控制台）可并行，但 README 重写（Task 3）必须最后做以避免与前两者不一致。
- Phase 3 中按页切片可多代理并行（Task 9–12），但必须各自独立更新自己的 `locales/*.ts` 并在合并前跑 `tests/unit/i18n-keys.test.ts`。
- Phase 4 三个任务可并行。
- Phase 5 不允许并行。

## 11. Change Control

- 任务执行过程中发现规格缺口：先更新技术规格（追加 §13 国际化与命名规范）并请求批准，再更新 plan/todo。
- PRD 范围变化：新增 PRD 版本，并让执行计划前两位随之变化；本计划固定为 1.0.2。
- 命名/包名/目录/二进制重命名属于产品级变化，批准本计划时必须显式选择。
- 仅实现细节变化且不影响契约与边界：记录在 `docs/modules/skills-manager-explorer/handoff/技能管家浏览器-handoff-<日期>_<时间>.md`。
- 每个任务完成后更新 TODO 勾选状态和验证证据，不以聊天结论替代文件记录。
- 不删除失败测试；若测试预期错误，先说明原因并修正规格或测试。

## 12. Project Definition of Done

一个任务只有同时满足以下条件才可勾选完成：

- [ ] 任务验收条件全部满足。
- [ ] 指定验证命令实际执行并记录结果。
- [ ] 新行为有先失败后通过的测试，或说明为何不适用。
- [ ] 相关 Zod、OpenAPI、locale 资源、API、页面和测试保持一致。
- [ ] 没有引入未批准的 i18n 库第二套方案。
- [ ] 没有扩大数据库写边界。
- [ ] 改动文件数与任务范围一致；超过约 8 个文件时先拆任务或记录批准理由。
- [ ] 工作区原有用户改动未被覆盖。
- [ ] TODO 已更新验证证据和剩余风险。

项目只有同时满足以下条件才可交付：

- [ ] Checkpoint A–E 全部通过。
- [ ] 中英两种语言在核心路径上验收通过。
- [ ] `bun run verify`、覆盖率、E2E 在 macOS 通过。
- [ ] README、AGENTS、project-specs、规格、OpenAPI、单文件产物路径互相一致。
- [ ] 未跑项和剩余风险已写入 `test/` 或 `handoff/`。

## 13. Approval Gate

本计划与配套 TODO 在用户批准后进入 IMPLEMENT 阶段。批准时已确认：

- **包名 / 模块目录 / 二进制同步重命名为 `skills-manager-explorer`**（**已批准**）。`docs/modules/skills-manager-browser/` → `docs/modules/skills-manager-explorer/` 已 `git mv` 完成；`package.json` 的 `name`、OpenAPI 文件名、`scripts/package*` 输出路径、`tests/fixtures/` / `e2e/` / `playwright.config.ts` 中所有引用旧名的路径与命令在 Task 1 中完成替换。仓库根目录路径与 `SKILLS_MANAGER_DB` 环境变量名 **不** 在 1.0.2 范围内重命名，详情见 handoff 记录。
- **默认语言**：`zh-CN`（**已确认**）。`en-US` 作为可选切换。
- **README 中“上游项目链接”** 仅在顶部声明一次（**已确认**），即“本项目是 `https://github.com/xingkongliang/skills-manager` 的浏览器扩展”。功能 / 使用 / 启动节中如需引用上游项目，使用文字描述（“上游 Skills Manager 项目”“原项目”）代替重复链接。
