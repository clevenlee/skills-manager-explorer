# 技能管家浏览器 TODO 1.0.2

## 使用说明

- 对应计划：`技能管家浏览器-plan-local-fullstack-1.0.2.md`。
- 当前状态：待用户批准（pending APPROVAL）。
- 实施原则：纵向切片、双语言回归、文案与契约同步。每任务原则上不超过约 8 个文件，超出先拆任务或记录批准理由。
- 每项完成后勾选验收与验证，并在“执行记录”写入命令结果与剩余风险。
- 任何涉及产品边界、契约、错误码、数据库写边界、命名包名/目录/二进制的改动，必须先回写计划并取得批准。
- 本计划不修改 PRD 1.0；默认语言 `zh-CN`，新增 `en-US`，顶栏可切换并持久化。

## Phase 1：命名与文档基线

### Task 1：替换仓库级与模块级面向用户的文档产品名 + 包名 / OpenAPI 文件名 / 单文件产物路径重命名

**Description：** 把 `技能管家浏览器` 统一为 `Skills Manager Explorer`（英文显示）/ `Skills Manager 分析界面`（中文显示），并按用户批准同步把包名、模块目录、OpenAPI 文件名、单文件产物路径重命名为 `skills-manager-explorer`。模块目录已 `git mv` 完成（`docs/modules/skills-manager-browser/` → `docs/modules/skills-manager-explorer/`），下游任务直接基于新路径工作；本任务负责剩下的包 / OpenAPI / scripts / fixtures / e2e 路径替换与文档产品名统一。

**Acceptance criteria：**

- [ ] 文档产品名替换：`AGENTS.md`、`README.md`（临时版本，待 Task 3 收口）、`docs/project-specs/overview.md`、`module-inventory.md`、`docs/modules/skills-manager-explorer/prd/`、`spec/`、现有 1.0.1 plan/todo/verify 中的产品名。
- [ ] `package.json` 的 `name` 字段改为 `skills-manager-explorer`；`bun.lock` 中 package 名同步（若自动管理则 `bun install` 重新生成）。
- [ ] OpenAPI 文件名改为 `docs/modules/skills-manager-explorer/openapi/skills-manager-explorer-local-openapi.yaml`；`src/shared/contracts/openapi.ts` 中 `info.title` / `info.description` / 任何 `x-locale-resources` 路径引用同步。
- [ ] `scripts/package*` 中 `--outfile` / `--target` 等输出路径改为 `dist/skills-manager-explorer`。
- [ ] `tests/fixtures/`、`e2e/`、`playwright.config.ts` 中所有引用旧包名 / 旧产物 / 旧模块目录路径的字符串与命令替换；`bun.lock` 与依赖脚本同步。
- [ ] handoff 记录：在 `docs/modules/skills-manager-explorer/handoff/技能管家浏览器-handoff-<日期>_<时间>.md` 写明“包名 / 模块目录 / 二进制已重命名”、未重命名项（仓库根目录路径 `ninerivers/ndp-tools/skills-manager-explorer/`、`.env.sample` 中 `SKILLS_MANAGER_DB`）。
- [ ] `.env.sample` 中 `SKILLS_MANAGER_DB` 默认注释保持原样（指向上游 Skills Manager SQLite 数据库，与本产品名解耦）。

**Verification：**

- [ ] `rg -n '技能管家浏览器|Skills Manager Browser' AGENTS.md README.md docs/project-specs docs/modules/skills-manager-explorer/prd docs/modules/skills-manager-explorer/spec` 无遗留旧名。
- [ ] `rg -n 'Skills Manager Explorer|Skills Manager 分析界面' AGENTS.md docs/project-specs docs/modules/skills-manager-explorer` 在面向用户的段落命中。
- [ ] `rg -n 'skills-manager-browser' package.json src/ scripts/ tests/ e2e/ playwright.config.ts` 无遗留旧名。
- [ ] `package.json` 的 `name` 字段为 `skills-manager-explorer`。
- [ ] `bun run openapi:generate && bun run openapi:check` 通过；OpenAPI 文件名与新名一致。

**Dependencies：** 无。

**Files likely touched：**

- `AGENTS.md`
- `README.md`（临时版本，Task 3 收口）
- `docs/project-specs/overview.md`
- `docs/project-specs/module-inventory.md`
- `docs/modules/skills-manager-explorer/prd/skills-manager-explorer-prd-1.0.md`
- `docs/modules/skills-manager-explorer/spec/skills-manager-explorer-spec-1.0.md`
- `docs/modules/skills-manager-explorer/exec-plans/技能管家浏览器-plan-local-fullstack-1.0.1.md`
- `docs/modules/skills-manager-explorer/exec-plans/技能管家浏览器-todo-local-fullstack-1.0.1.md`
- `package.json`
- `bun.lock`（如需）
- `src/shared/contracts/openapi.ts`
- `docs/modules/skills-manager-explorer/openapi/skills-manager-explorer-local-openapi.yaml`（由 `openapi:generate` 重新生成）
- `scripts/package*`（按项目实际脚本名）
- `tests/fixtures/`（按需）
- `e2e/`（按需）
- `playwright.config.ts`（按需）
- `docs/modules/skills-manager-explorer/handoff/技能管家浏览器-handoff-<日期>_<时间>.md`（新增）

**Estimated scope：** L，10–12 个文件；按 §11 “超过约 8 个文件” 规则，已在 plan Approval Gate 中显式批准。

---

### Task 2：替换非 i18n 路径上的系统显示

**Description：** 替换 `index.html`、`OpenAPI` 标题与描述、服务端启动日志中的旧产品名，使其与 Task 1 的文档一致。

**Acceptance criteria：**

- [ ] `index.html` 的 `<title>` 改为 `Skills Manager Explorer`（zh-CN locale 切换由 Phase 2 i18n 覆盖）。
- [ ] `src/shared/contracts/openapi.ts` 的 `info.title` 改为 `Skills Manager Explorer API`；`info.description` 同时含中英说明。
- [ ] `src/server/index.ts` 启动日志中产品名替换为 `Skills Manager Explorer`。
- [ ] `bun run openapi:generate && bun run openapi:check` 通过；OpenAPI `info.title` 与 `info.description` 与新名称一致。

**Verification：**

- [ ] `rg -n '技能管家浏览器|Skills Manager Browser' index.html src/shared/contracts src/server` 无遗留旧名。
- [ ] `bun run openapi:lint && bun run openapi:check` 通过。
- [ ] `bun run dev` 启动后控制台输出含 `Skills Manager Explorer` 且不出现旧名。

**Dependencies：** Task 1。

**Files likely touched：**

- `index.html`
- `src/shared/contracts/openapi.ts`
- `src/shared/contracts/openapi.ts` 触发的 OpenAPI 生成物
- `src/server/index.ts`

**Estimated scope：** S，3–4 个文件。

---

### Task 3：README 重写

**Description：** 按用户要求重写 README 顶部说明，明确本项目是 [https://github.com/xingkongliang/skills-manager](https://github.com/xingkongliang/skills-manager) 的浏览器扩展，并按现有功能、启动、单文件打包、日常使用、契约/Mock、国际化等节组织内容。

**Acceptance criteria：**

- [ ] 顶部一段明确说明本项目是 [https://github.com/xingkongliang/skills-manager](https://github.com/xingkongliang/skills-manager) 的浏览器扩展。
- [ ] “功能”节按 PRD 1.0 §8 描述概览、来源、场景、Skill 列表/详情、比对、归属调整。
- [ ] “本地启动”节给出 `bun install --frozen-lockfile`、`cp .env.sample .env`、`bun run dev`，标明 5173 / 4173 端口。
- [ ] “单文件打包”节给出 `bun run build && bun run package` 与产物路径 `dist/skills-manager-explorer`（与新包名一致）。
- [ ] “使用”节按概览 → 来源/场景 → Skill 列表 → 详情 → 归属调整 → 比对的主路径描述。
- [ ] “契约与 Mock”节给出 `bun run openapi:generate`、`openapi:lint`、`openapi:check`、`mock` 与 Prism 4010。
- [ ] “国际化”节在 Phase 2 完成后补齐：默认 `zh-CN`、`en-US` 可切换、持久化策略。
- [ ] README 顶部不再出现旧产品名。

**Verification：**

- [ ] `rg -n '技能管家浏览器|Skills Manager Browser' README.md` 无遗留。
- [ ] `README.md` 中“扩展 / 浏览器扩展 / extension / extends”关键词命中顶部一段且明确指向 [https://github.com/xingkongliang/skills-manager](https://github.com/xingkongliang/skills-manager)。
- [ ] README 渲染（本地或 GitHub）显示完整结构，无空段。

**Dependencies：** Task 1。

**Files likely touched：**

- `README.md`

**Estimated scope：** S，1 个文件。

---

### Checkpoint A：命名与 README 一致

- [ ] AGENTS、project-specs、规格、PRD、OpenAPI title、index.html、控制台启动日志中的产品名一致。
- [ ] README 顶部明示本项目是 [https://github.com/xingkongliang/skills-manager](https://github.com/xingkongliang/skills-manager) 的浏览器扩展，且覆盖功能、启动、使用、契约/Mock、单文件打包、国际化的全部要点。
- [ ] 若用户批准包名/目录/二进制重命名，对应 `package.json`、`bun.lock`（如需）、`scripts/package*`、`docs/` 中所有路径同步完成；否则在 `handoff/` 显式记录未重命名项。

## Phase 2：i18n 基础设施

### Task 4：引入 vue-i18n 与 locale 资源骨架

**Description：** 引入 `vue-i18n@9`，搭建 `src/web/i18n/`，注册 `zh-CN` 与 `en-US` 两种 locale，提供类型安全的 key 命名。

**Acceptance criteria：**

- [ ] 依赖新增 `vue-i18n@9.x`（与 Vue 3.5 兼容），`package.json` 与 `bun.lock` 同步。
- [ ] `src/web/i18n/index.ts` 创建 i18n 实例、注册两个 locale、`fallbackLocale: 'zh-CN'`、`legacy: false`，开发环境开启 `missingWarn` / `fallbackWarn`，生产环境关闭。
- [ ] `src/web/i18n/locales/zh-CN.ts` 与 `en-US.ts` 提供分模块扁平 key，模块至少包含 `app`/`nav`/`common`/`errors`/`status`/`overview`/`sources`/`scenarios`/`skills`/`comparison`/`assignment`。
- [ ] 类型层基于 `zh-CN` 推断并对 `en-US` 做 key 一致性编译期检查。
- [ ] `src/web/main.ts` 注册 i18n 实例。

**Verification：**

- [ ] `bun install --frozen-lockfile` 成功。
- [ ] `bun run typecheck` 通过。
- [ ] `bun run dev` 启动后控制台无 i18n missing/fallback 警告（即使尚未抽取全部文案，已有 key 不缺失）。
- [ ] 在任一页面临时 `t('app.title')` 调用能正确返回对应语言字符串。

**Dependencies：** Task 1、Task 2。

**Files likely touched：**

- `package.json`
- `bun.lock`
- `src/web/i18n/index.ts`（新增）
- `src/web/i18n/locales/zh-CN.ts`（新增）
- `src/web/i18n/locales/en-US.ts`（新增）
- `src/web/main.ts`

**Estimated scope：** M，5–6 个文件。

---

### Task 5：实现语言切换器与持久化

**Description：** 在顶栏实现语言切换器，暴露 `useLocale()` 组合式函数，切换时同步 `localStorage` 与 `document.documentElement.lang`。

**Acceptance criteria：**

- [ ] `src/web/composables/useLocale.ts` 暴露 `locale`（`Ref<'zh-CN' | 'en-US'>`）、`setLocale` 函数。
- [ ] `src/web/components/LocaleSwitcher.vue` 顶栏控件，aria-label 国际化，键盘可达。
- [ ] 切换时同步 `localStorage.skillsManagerExplorer.locale` 与 `document.documentElement.lang`。
- [ ] 启动时按 §4 决策 #6 顺序解析用户偏好：`localStorage` → `navigator.languages` → 回退 `zh-CN`。
- [ ] 切换语言不触碰路由状态、查询参数、滚动位置。

**Verification：**

- [ ] 在 `zh-CN` 下切换到 `en-US`，顶栏文案、`<html lang>` 立即变化；刷新页面后保留 `en-US`。
- [ ] 清除 `localStorage` 后，浏览器语言为 `en-US` 时自动选 `en-US`；浏览器语言为 `zh-CN` 时自动选 `zh-CN`；浏览器语言为 `ja-JP` 时回退 `zh-CN`。
- [ ] 切换语言时 URL 不变、滚动位置不跳。

**Dependencies：** Task 4。

**Files likely touched：**

- `src/web/composables/useLocale.ts`（新增）
- `src/web/components/LocaleSwitcher.vue`（新增）
- `src/web/main.ts` 或 `App.vue` 启动逻辑
- `src/web/layouts/AppLayout.vue`（接入 LocaleSwitcher）

**Estimated scope：** S，4 个文件。

---

### Task 6：HTML lang/meta 与 OpenAPI 扩展

**Description：** 把 `index.html` 的 `<html lang>` 与 meta 描述同步到当前 locale，并在 OpenAPI 中登记双语言文案扩展。

**Acceptance criteria：**

- [ ] `index.html` 静态 `<html lang="zh-CN">`，启动时按当前 locale 改写。
- [ ] `index.html` 的 `meta description` 同步为新名称与一句话定位。
- [ ] `src/shared/contracts/openapi.ts` 增加 `x-locale-resources` 自定义扩展，登记 `zh-CN` 与 `en-US` 资源路径。
- [ ] `bun run openapi:generate` 后 `info['x-locale-resources']` 出现双语言条目。

**Verification：**

- [ ] `rg -n 'lang="' index.html` 命中启动时的初始与运行时设置点。
- [ ] `bun run openapi:lint && bun run openapi:check` 通过。
- [ ] 启动后查看 `document.documentElement.lang` 与当前 locale 一致。

**Dependencies：** Task 4、Task 5。

**Files likely touched：**

- `index.html`
- `src/shared/contracts/openapi.ts`
- OpenAPI 生成物

**Estimated scope：** S，2–3 个文件。

---

### Checkpoint B：i18n 基础设施可用

- [ ] 切换语言后顶栏、页面标题、`<html lang>` 即时更新。
- [ ] `localStorage.skillsManagerExplorer.locale` 在刷新后保留。
- [ ] `bun run dev` 控制台无 i18n missing/fallback 警告（即使尚未抽取全部文案也要保证已有 key 不缺失）。

## Phase 3：文案抽取（纵向切片）

### Task 7：共享枚举与通用文案（common / errors / status）

**Description：** 抽取通用按钮、表格列头、状态文案、错误码中文展示到 `common`、`errors`、`status` 三个模块。

**Acceptance criteria：**

- [ ] 通用按钮：确认、取消、保存、返回、搜索、重置、清空条件、加载更多、上一页、下一页、每页 N 条、复制成功/失败。
- [ ] `errors` 模块覆盖 `DATABASE_UNAVAILABLE`、`DATABASE_INCOMPATIBLE`、`DATABASE_READ_ONLY`、`DATABASE_LOCKED`、`SCENARIO_OR_SKILL_NOT_FOUND`、`CONCURRENT_MODIFICATION`、`VALIDATION_ERROR`、`INTERNAL_ERROR`。
- [ ] `status` 模块覆盖 `enabled/disabled`、`updatable/latest/check_error`、`connected/disconnected/in_progress`、可写性、解决建议。
- [ ] `zh-CN` 与 `en-US` 两侧 key 完全一致。

**Verification：**

- [ ] `tests/unit/i18n-keys.test.ts` 临时引入并在 Task 17 落定后验证 key 一致性。
- [ ] `bun run typecheck` 通过。

**Dependencies：** Task 4。

**Files likely touched：**

- `src/web/i18n/locales/zh-CN.ts`
- `src/web/i18n/locales/en-US.ts`
- `src/web/components/RequestState.vue`（部分接入）

**Estimated scope：** M，2–3 个文件。

---

### Task 8：布局 + 导航 + 路由 title

**Description：** 抽取 `AppLayout`、`App.vue`、路由 meta 中的中文文案与 aria-label，并实现路由切换时更新 `document.title`。

**Acceptance criteria：**

- [ ] `AppLayout.vue` 中品牌、主菜单、面包屑、空状态、aria-label、Drawer 标题国际化。
- [ ] 路由表 `meta.titleKey` 配置齐全，`router.afterEach` 中 `document.title = t(meta.titleKey)`。
- [ ] 在 `en-US` 下顶栏显示 `Overview / Sources / Scenarios / Skills / Compare`。
- [ ] 在 `zh-CN` 下与 1.0.1 一致：`概览 / 来源 / 场景 / Skills / 比对`。

**Verification：**

- [ ] 切换语言时所有菜单与按钮立即变化，无需刷新。
- [ ] 切到 `/sources`、`/scenarios`、`/skills`、`/compare`、`/status` 时 `document.title` 同步更新。

**Dependencies：** Task 5、Task 7。

**Files likely touched：**

- `src/web/layouts/AppLayout.vue`
- `src/web/router/index.ts`
- `src/web/main.ts` 或独立 `src/web/composables/useDocumentTitle.ts`

**Estimated scope：** M，3 个文件。

---

### Task 9：概览 + 数据库状态页

**Description：** 抽取 `OverviewView`、`StatusView` 中的中文文案。

**Acceptance criteria：**

- [ ] 概览卡片标题、副标题、点击提示、空态国际化。
- [ ] 状态页数据库路径占位、可写性、错误项、解决建议国际化。
- [ ] 切换语言后 `OverviewView` 与 `StatusView` 全部文案随之更新。

**Verification：**

- [ ] E2E 或单元测试覆盖 `OverviewView` 双语言核心文本。
- [ ] `bun run typecheck` 与 `bun run verify` 通过。

**Dependencies：** Task 7、Task 8。

**Files likely touched：**

- `src/web/views/OverviewView.vue`
- `src/web/views/StatusView.vue`

**Estimated scope：** S，2 个文件。

---

### Task 10：来源 + 场景

**Description：** 抽取 `SourcesView`、`ScenariosView` 的列表/详情、搜索占位、排序标签、空匹配、分页、规范化展示名称（如“未知来源”）。

**Acceptance criteria：**

- [ ] 来源/场景列表、详情、搜索、排序、分页、aria-label 全部国际化。
- [ ] “未知来源”、“GitHub 仓库地址不可识别”等规范化展示名称在 `en-US` 下为 `Unknown source` / `Unrecognized GitHub URL`。
- [ ] 来源地址可识别为合法 URL 时，hover/aria-label 在两种语言下提供一致的“在新窗口打开”提示。

**Verification：**

- [ ] `bun run verify` 通过。
- [ ] 在 `en-US` 下浏览来源、场景页面，无中文字面量残留。

**Dependencies：** Task 7、Task 8。

**Files likely touched：**

- `src/web/views/SourcesView.vue`
- `src/web/views/ScenariosView.vue`
- `src/web/i18n/locales/zh-CN.ts`
- `src/web/i18n/locales/en-US.ts`

**Estimated scope：** M，4 个文件。

---

### Task 11：Skills 列表 + 详情

**Description：** 抽取 `SkillsView`、`SkillDetailView` 的列表筛选、排序、分页、视图切换、详情全字段标签、所属场景、“调整场景归属”入口与提示。

**Acceptance criteria：**

- [ ] 列表筛选、排序、分页、视图切换、复制长字段的提示国际化。
- [ ] 详情全字段（`id`/`name`/`description`/`source_type`/`source_ref`/`source_ref_resolved`/`source_subpath`/`source_branch`/`source_revision`/`remote_revision`/`central_path`/`content_hash`/`enabled`/`created_at`/`updated_at`/`status`/`update_status`/`last_checked_at`/`last_check_error`）标签国际化。
- [ ] 所属场景展示与“未归属场景”状态国际化。
- [ ] “调整场景归属”入口、二次确认、原子回滚提示国际化。

**Verification：**

- [ ] `bun run verify` 通过。
- [ ] 切到 `en-US` 时 Skills 列表与详情页全英文。

**Dependencies：** Task 7、Task 8。

**Files likely touched：**

- `src/web/views/SkillsView.vue`
- `src/web/views/SkillDetailView.vue`
- `src/web/i18n/locales/zh-CN.ts`
- `src/web/i18n/locales/en-US.ts`

**Estimated scope：** L，4 个文件。

---

### Task 12：比对

**Description：** 抽取 `SkillComparisonView` 的左右集合选择、四种视图名称、交换按钮、空集合提示、结果计数。

**Acceptance criteria：**

- [ ] 左右集合选择标签（来源/场景）、四种视图（共有/仅左侧/仅右侧/全部差异）国际化。
- [ ] 交换按钮、空集合提示、结果计数、搜索/排序标签国际化。
- [ ] 在 `en-US` 下视图为 `Intersection / Only left / Only right / Symmetric difference`。

**Verification：**

- [ ] `bun run verify` 通过。
- [ ] E2E 中英 smoke 覆盖比对路径。

**Dependencies：** Task 7、Task 8。

**Files likely touched：**

- `src/web/views/SkillComparisonView.vue`
- `src/web/i18n/locales/zh-CN.ts`
- `src/web/i18n/locales/en-US.ts`

**Estimated scope：** S，3 个文件。

---

### Task 13：统一收敛错误/空态/加载/确认弹窗

**Description：** 把 `RequestState.vue` 与所有页面级 loading/empty/error slot、`Modal.confirm`、`Popconfirm`、保存中/成功/失败回滚的反馈统一收敛到 i18n。

**Acceptance criteria：**

- [ ] 所有页面级 loading/empty/error 文案走 i18n，不再硬编码。
- [ ] `Modal.confirm` / `Popconfirm` 的标题、内容、确认按钮、取消按钮走 i18n。
- [ ] 保存中（防止重复提交）、保存成功、失败回滚的反馈走 i18n。

**Verification：**

- [ ] `bun run verify` 通过。
- [ ] 在 `en-US` 下，所有错误提示与确认弹窗全英文。

**Dependencies：** Task 7–12（依赖所有页面完成 i18n 后再做最后收敛）。

**Files likely touched：**

- `src/web/components/RequestState.vue`
- 各 `views/*.vue`（共 6 个）
- `src/web/i18n/locales/zh-CN.ts`
- `src/web/i18n/locales/en-US.ts`

**Estimated scope：** L，8–10 个文件（按 §11 “超过约 8 个文件”规则，此处任务需在执行前拆分或记录批准理由）。

---

### Checkpoint C：所有页面中英双语言可验收

- [ ] 任意页面在 `en-US` 下：标题、菜单、按钮、字段标签、空态、错误提示全部为英文。
- [ ] 任意页面在 `zh-CN` 下：与 1.0.1 现状一致（不出现 “未翻译” 字样或空 key）。
- [ ] 同一 URL 在切换语言后仅更新文案，不出现路由抖动、滚动位置丢失或查询参数清空。

## Phase 4：区域感知

### Task 14：日期/时间 locale 化

**Description：** 把所有 `new Date(...).toLocaleString("zh-CN")` 改为基于当前 i18n locale 的 `formatDate` 工具。

**Acceptance criteria：**

- [ ] `src/web/views/SkillDetailView.vue`、`SkillsView.vue` 中所有日期/时间渲染走 `useLocale()` 提供的 `formatDate`。
- [ ] 在 `zh-CN` 下显示为 `2026/7/17 12:34:56`；在 `en-US` 下显示为 `7/17/2026, 12:34:56`（或项目约定的统一格式）。
- [ ] 不再出现硬编码 `"zh-CN"` 字符串。

**Verification：**

- [ ] `rg -n 'toLocaleString\("zh-CN"\)' src/` 无命中。
- [ ] E2E 在两种语言下抓取 DOM 文本验证格式。

**Dependencies：** Task 11（Skills 视图已 i18n）。

**Files likely touched：**

- `src/web/composables/useLocale.ts`（追加 `formatDate`）
- `src/web/views/SkillDetailView.vue`
- `src/web/views/SkillsView.vue`
- `src/web/views/OverviewView.vue`（如涉及）
- `src/web/i18n/locales/zh-CN.ts`（日期格式相关 key，可选）

**Estimated scope：** S，4–5 个文件。

---

### Task 15：排序 locale 化

**Description：** 把前端兜底排序的 `localeCompare(..., "zh-CN")` 改为基于当前 i18n locale 的实现；服务端保留 `COLLATE NOCASE` 兜底。

**Acceptance criteria：**

- [ ] 前端所有 `localeCompare` 调用使用 `currentLocale` 而非硬编码。
- [ ] 服务端 `src/server/services/catalog-service.ts`、`comparison-service.ts` 排序 SQL 保留 `ORDER BY name COLLATE NOCASE`；如需更精细排序（如中文按拼音、英文按字母），需在规格中追加小节并取得批准。
- [ ] 同一组数据在 `zh-CN` 与 `en-US` 下排序结果稳定且符合各自语言习惯。

**Verification：**

- [ ] `rg -n 'localeCompare\(' src/web/ src/server/` 中硬编码 `"zh-CN"` 全部消除。
- [ ] `bun run verify` 通过。
- [ ] E2E 抓取列表顺序在两种语言下分别符合预期。

**Dependencies：** Task 11（Skills 列表已 i18n）。

**Files likely touched：**

- `src/web/composables/useLocale.ts`（追加 `compareStrings`）
- `src/web/views/SkillsView.vue`
- `src/web/views/SourcesView.vue`
- `src/web/views/ScenariosView.vue`

**Estimated scope：** S，4 个文件。

---

### Task 16：数字格式

**Description：** 概览卡片、列表数量等使用 `Intl.NumberFormat(currentLocale)` 渲染；大数缩写统一规则并文档化。

**Acceptance criteria：**

- [ ] 概览卡片、列表数量、计数走 `useLocale().formatNumber`。
- [ ] 大数缩写（如 `1.2K`）在 `en-US` 下为 `1.2K`，在 `zh-CN` 下为 `1.2K`（中英文一致不缩写，仍以 `formatNumber` 控制千分位）。
- [ ] 不再出现硬编码千分位或大数缩写。

**Verification：**

- [ ] `rg -n '\.toLocaleString\("zh-CN"\)|toLocaleString\(' src/web/` 中针对数字的硬编码全部消除。
- [ ] `bun run verify` 通过。

**Dependencies：** Task 9（概览页已 i18n）。

**Files likely touched：**

- `src/web/composables/useLocale.ts`（追加 `formatNumber`）
- `src/web/views/OverviewView.vue`
- `src/web/views/SkillsView.vue`（如涉及）

**Estimated scope：** S，3 个文件。

---

### Checkpoint D：区域感知一致

- [ ] 在 `en-US` 下 `2026-07-17T...` 显示为 `7/17/2026, ...`（浏览器默认）或项目自定义的 `MM/DD/YYYY HH:mm`。
- [ ] 在 `zh-CN` 下显示为 `2026/7/17 ...`。
- [ ] 来源/场景/Skill 排序在两种语言下结果稳定且符合各自语言习惯。

## Phase 5：验证与回归

### Task 17：i18n key 完整性检测

**Description：** 写 `tests/unit/i18n-keys.test.ts`，校验 `en-US` 包含 `zh-CN` 全部 key，缺失时 `bun run verify` 失败。

**Acceptance criteria：**

- [ ] `tests/unit/i18n-keys.test.ts` 校验：
  - `en-US` 的 key 集合是 `zh-CN` 的超集；
  - 反向（`zh-CN` 是 `en-US` 的超集）作为警告而非失败，避免临时回退；
  - 缺失 key 在错误信息中打印所属模块与路径。
- [ ] `bun run verify` 中包含此测试。

**Verification：**

- [ ] 删除 `en-US` 中任一关键 key（例如 `app.title`）后 `bun run verify` 失败并指出缺失 key。
- [ ] 恢复后 `bun run verify` 通过。

**Dependencies：** Task 4、Task 7–13。

**Files likely touched：**

- `tests/unit/i18n-keys.test.ts`（新增）
- `package.json` scripts（如需把 i18n test 加入 verify）

**Estimated scope：** S，1–2 个文件。

---

### Task 18：E2E 中英 smoke + 视觉对比

**Description：** `e2e/i18n.spec.ts` 跑 `zh-CN` 与 `en-US` 各一次主页、来源、Skill 列表、比对核心路径；关键文本断言使用 `data-testid` + i18n key，不依赖硬编码中英文字面量。

**Acceptance criteria：**

- [ ] `e2e/i18n.spec.ts` 覆盖概览、来源、场景、Skill 列表、详情、比对；两种语言各跑一次。
- [ ] 关键交互元素加上 `data-testid`，E2E 通过 `data-testid` + i18n key 取得文本。
- [ ] `bun run test:e2e` 在 macOS 通过。

**Verification：**

- [ ] `bun run test:e2e` 全部通过。
- [ ] 在 `en-US` 跑完后手动截图与 1.0.1 verify 截图对比，差异在 handoff 记录。

**Dependencies：** Task 7–13、Task 17。

**Files likely touched：**

- `e2e/i18n.spec.ts`（新增）
- 各 `views/*.vue`（按需加 `data-testid`）

**Estimated scope：** M，2–3 个文件。

---

### Task 19：契约/项目文档同步与决策笔记

**Description：** 更新技术规格 §4/§5/§13/§14、project-specs、`module-inventory.md`；按需在 `handoff/` 追加命名/i18n 决策。

**Acceptance criteria：**

- [ ] `docs/modules/skills-manager-explorer/spec/skills-manager-explorer-spec-1.0.md` 追加 §13 “国际化与命名规范”、更新 §4 技术栈 i18n 依赖、§5 运行结构关于 i18n 的描述、§14 依赖表加入 `vue-i18n@9.x`。
- [ ] `docs/project-specs/overview.md`、`module-inventory.md` 同步 i18n 与新名称。
- [ ] 若用户在 Approval Gate 选择包名/目录/二进制重命名或默认语言改浏览器探测，追加 `docs/modules/skills-manager-explorer/handoff/技能管家浏览器-handoff-<日期>_<时间>.md` 记录决策。
- [ ] OpenAPI title/description 与新名称一致；`bun run openapi:generate && bun run openapi:check` 通过。

**Verification：**

- [ ] `rg -n 'vue-i18n|locale' docs/modules/skills-manager-explorer/spec/skills-manager-explorer-spec-1.0.md` 命中新增段落。
- [ ] `bun run openapi:lint && bun run openapi:check` 通过。
- [ ] `docs/project-specs/module-inventory.md` 反映 1.0.2 计划存在。

**Dependencies：** Task 1–3、Task 4、Task 6。

**Files likely touched：**

- `docs/modules/skills-manager-explorer/spec/skills-manager-explorer-spec-1.0.md`
- `docs/project-specs/overview.md`
- `docs/project-specs/module-inventory.md`
- `docs/modules/skills-manager-explorer/handoff/技能管家浏览器-handoff-<日期>_<时间>.md`（按需）

**Estimated scope：** M，3–4 个文件。

---

### Task 20：全量回归与交付记录

**Description：** 跑全量验证与单文件 smoke；写入 `test/技能管家浏览器-verify-local-fullstack-1.0.2.md`。

**Acceptance criteria：**

- [ ] `bun run verify` 通过。
- [ ] `bun run test:coverage` 通过，覆盖率不低于 1.0.1 基线。
- [ ] `bun run test:e2e` 在 macOS 通过。
- [ ] `bun run openapi:check && bun run openapi:lint` 通过。
- [ ] `bun run package` 在干净环境启动并访问主页成功。
- [ ] `docs/modules/skills-manager-explorer/test/技能管家浏览器-verify-local-fullstack-1.0.2.md` 记录所有命令结果、未跑项与剩余风险。
- [ ] 1.0.2 plan/todo 中所有 checkbox 已勾选；handoff 记录已写。

**Verification：**

- [ ] 上述命令输出保存到 verify 文档。
- [ ] AGENTS、project-specs、规格、PRD、OpenAPI、README、契约生成物、单文件产物路径互相一致。

**Dependencies：** Task 1–19。

**Files likely touched：**

- `docs/modules/skills-manager-explorer/test/技能管家浏览器-verify-local-fullstack-1.0.2.md`（新增）
- 各 verify 引用文件

**Estimated scope：** S，1–2 个文件。

---

### Checkpoint E：1.0.2 可交付

- [ ] 上述所有 Checkpoint A–D 通过。
- [ ] `bun run verify`、覆盖率、E2E 在 macOS 通过。
- [ ] 中英两种语言在核心路径上无 i18n 缺失或回退警告。
- [ ] AGENTS、project-specs、规格、PRD、OpenAPI、README、契约生成物、单文件产物路径互相一致。
- [ ] `handoff/` 或 `test/` 记录了“包名/目录/二进制是否重命名”的最终决定及理由。

## 执行记录（按任务填写）

### Task 1 执行记录

- 实际改动文件：TBD
- 验证命令与结果：TBD
- 剩余风险：TBD

### Task 2 执行记录

- 实际改动文件：TBD
- 验证命令与结果：TBD
- 剩余风险：TBD

（其余任务在执行后按相同格式回填）
