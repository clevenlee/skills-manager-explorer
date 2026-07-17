# 技能管家浏览器 TODO 1.0.1

## 使用说明

- 对应计划：`技能管家浏览器-plan-local-fullstack-1.0.1.md`。
- 当前状态：Tasks 1-27 与 Checkpoint A-E 已完成。
- 严格按依赖顺序实施。每个任务应在一个聚焦会话内完成，原则上不超过约 5 个文件。
- 每项完成后勾选验收与验证，并在“执行记录”中写入命令结果和剩余风险。
- 所有写入测试只允许使用临时 SQLite fixture。

## Phase 1：可验证基础

### Task 1：初始化 Bun 工具链与质量脚本

**Description：** 建立单包 Bun 项目，锁定规格中的依赖版本，提供 lint、format、typecheck、test、build、verify 等脚本入口，但暂不实现业务功能。

**Acceptance criteria：**

- [x] `package.json` 声明 Bun 版本、生产依赖、开发依赖和规格要求的命令入口。
- [x] `bun.lock` 锁定精确依赖，冻结安装可复现。
- [x] TypeScript、ESLint 和 Prettier 使用严格且互相兼容的配置。

**Verification：**

- [x] `bun --version` 输出规格基线版本。
- [x] `bun install --frozen-lockfile` 成功。
- [x] `bun run typecheck`、`bun run lint`、`bun run format:check` 能执行；允许因尚无源码而空通过。

**Dependencies：** 无。

**Files likely touched：**

- `package.json`
- `bun.lock`
- `tsconfig.json`
- `eslint.config.ts`
- `playwright.config.ts`

**Estimated scope：** M，5 个文件。

### Task 2：建立 Vue/Vite/Hono 可运行骨架

**Description：** 建立最小前端入口、Vite 代理和 Bun/Hono 服务入口，使 `bun run dev` 可以同时访问网页和 `/api` 占位响应。

**Acceptance criteria：**

- [x] Vue 应用可渲染基础页面，Hono 服务可启动。
- [x] Vite 将 `/api` 代理到本地 Bun 服务。
- [x] 服务显式监听 `127.0.0.1`，拒绝配置为非回环地址。

**Verification：**

- [x] `bun run dev` 启动成功。
- [x] 浏览器可打开首页。
- [x] 请求本地服务占位 API 返回 200，监听地址不是 `0.0.0.0`。

**Dependencies：** Task 1。

**Files likely touched：**

- `index.html`
- `vite.config.ts`
- `src/web/main.ts`
- `src/web/App.vue`
- `src/server/index.ts`

**Estimated scope：** M，5 个文件。

### Task 3：建立配置、SQLite fixture 与结构兼容检查

**Description：** 使用 Zod 校验环境变量，建立不会隐式创建文件的 `bun:sqlite` 连接，并用隔离 fixture 测试有效、缺失和不兼容数据库。

**Acceptance criteria：**

- [x] `SKILLS_MANAGER_DB`、`HOST`、`PORT`、`LOG_LEVEL` 在启动边界完成校验。
- [x] 数据库文件不存在时不会被创建。
- [x] 兼容检查允许额外表和字段，但准确报告三张必需表或字段缺失。

**Verification：**

- [x] 先观察数据库兼容测试失败，再实现至通过。
- [x] `bun test tests/integration/database-compatibility.test.ts` 通过。
- [x] 测试结束后临时 fixture 被清理，真实数据库未变化。

**Dependencies：** Task 2。

**Files likely touched：**

- `src/server/config/app-config.ts`
- `src/server/database/open-database.ts`
- `src/server/database/check-schema.ts`
- `tests/fixtures/create-skills-db.ts`
- `tests/integration/database-compatibility.test.ts`

**Estimated scope：** M，5 个文件。

### Task 4：建立 Zod、OpenAPI 与 Prism 契约链

**Description：** 建立共享契约入口、OpenAPI 生成和漂移检查脚本，提交首份生成契约并确保 Prism 能启动。

**Acceptance criteria：**

- [x] Zod Schema 是唯一契约定义源。
- [x] OpenAPI YAML 可重复生成，带生成说明并禁止手改。
- [x] OpenAPI lint、漂移检查和 Prism Mock 均有稳定命令。

**Verification：**

- [x] `bun run openapi:generate` 成功。
- [x] `bun run openapi:lint` 成功。
- [x] `bun run openapi:check` 成功且工作区无生成差异。
- [x] `bun run mock` 可根据生成契约启动。

**Dependencies：** Task 1。

**Files likely touched：**

- `src/shared/contracts/openapi.ts`
- `scripts/generate-openapi.ts`
- `scripts/verify-openapi-drift.ts`
- `docs/modules/skills-manager-explorer/openapi/skills-manager-explorer-local-openapi.yaml`
- `docs/modules/skills-manager-explorer/openapi/README.md`

**Estimated scope：** M，5 个文件。

### Task 5：实现应用状态 API

**Description：** 实现 `getApplicationStatus` 契约和 `/api/v1/status`，返回数据库连接、Schema 兼容性和可写能力，不泄露完整路径。

**Acceptance criteria：**

- [x] 有效、缺失、不兼容和只读数据库得到契约定义的状态。
- [x] 响应不包含 SQL、异常堆栈或完整数据库路径。
- [x] API 实现和 OpenAPI examples 一致。

**Verification：**

- [x] 先观察状态 API 测试失败，再实现至通过。
- [x] `bun test tests/integration/status-api.test.ts` 通过。
- [x] `bun run openapi:check` 通过。

**Dependencies：** Task 3、Task 4。

**Files likely touched：**

- `src/shared/contracts/status.ts`
- `src/server/services/application-status-service.ts`
- `src/server/routes/status-route.ts`
- `src/server/app.ts`
- `tests/integration/status-api.test.ts`

**Estimated scope：** M，5 个文件。

### Task 6：实现应用壳与数据库状态体验

**Description：** 建立一级导航、统一 API 客户端和状态页面，使数据库异常在进入业务页面前可理解、可恢复。

**Acceptance criteria：**

- [x] 应用壳包含概览、来源、场景、Skill 和比对导航入口。
- [x] API 客户端统一解析成功和错误结构。
- [x] 状态页覆盖加载、正常、缺失、不兼容和只读状态。

**Verification：**

- [x] `bun run typecheck` 通过。
- [x] `bun run test:e2e -- e2e/status.spec.ts` 通过。
- [x] 手动确认窄屏下导航仍可使用。

**Dependencies：** Task 5。

**Files likely touched：**

- `src/web/api/api-client.ts`
- `src/web/router/index.ts`
- `src/web/layouts/AppLayout.vue`
- `src/web/views/StatusView.vue`
- `e2e/status.spec.ts`

**Estimated scope：** M，5 个文件。

## Checkpoint A：基础可用

- [x] Tasks 1-6 全部完成。
- [x] `bun run verify` 通过。
- [x] OpenAPI 可生成、lint、Mock 且无漂移。
- [x] 有效与异常数据库状态可被正确观察。
- [x] 用户确认基础架构后再继续 Phase 2。

## Phase 2：概览与目录浏览

### Task 7：实现概览 API

**Description：** 实现 `getOverview` 契约、聚合查询、服务和 API，准确返回 Skill、来源、场景和孤立 Skill 数量。

**Acceptance criteria：**

- [x] 四项核心指标与直接 SQL 结果一致。
- [x] 空数据库返回零值，不被视为错误。
- [x] 响应通过 Zod Schema 且 OpenAPI example 可用。

**Verification：**

- [x] 先观察概览 API 测试失败，再实现至通过。
- [x] `bun test tests/integration/overview-api.test.ts` 通过。
- [x] `bun run openapi:check` 通过。

**Dependencies：** Checkpoint A。

**Files likely touched：**

- `src/shared/contracts/overview.ts`
- `src/server/repositories/overview-repository.ts`
- `src/server/services/overview-service.ts`
- `src/server/routes/overview-route.ts`
- `tests/integration/overview-api.test.ts`

**Estimated scope：** M，5 个文件。

### Task 8：实现概览页面

**Description：** 展示核心指标卡片，并支持跳转至带筛选条件的业务列表。

**Acceptance criteria：**

- [x] 展示 Skill、来源、场景和孤立 Skill 数量。
- [x] 点击指标跳转到正确页面，孤立 Skill 自动带入筛选。
- [x] 覆盖加载、空数据和请求失败状态。

**Verification：**

- [x] `bun run typecheck` 通过。
- [x] `bun run test:e2e -- e2e/overview.spec.ts` 通过。
- [x] 手动确认指标跳转后的 URL 查询参数可恢复。

**Dependencies：** Task 7。

**Files likely touched：**

- `src/web/api/overview-api.ts`
- `src/web/views/OverviewView.vue`
- `src/web/components/MetricCard.vue`
- `src/web/router/index.ts`
- `e2e/overview.spec.ts`

**Estimated scope：** M，5 个文件。

### Task 9：实现来源规范化领域逻辑

**Description：** 按 PRD 优先级实现稳定来源标识、展示名称、fallback 和未知来源处理，并以表驱动测试固定规则。

**Acceptance criteria：**

- [x] 正确处理 HTTP/HTTPS、`.git`、尾斜杠、查询参数和片段。
- [x] GitHub 地址展示 `owner/repository`。
- [x] `source_ref_resolved` 缺失时才安全回退，不误删与 Skill 名不匹配的路径段。

**Verification：**

- [x] 先观察来源规范化测试失败，再实现至通过。
- [x] `bun test tests/unit/normalize-source.test.ts` 通过。
- [x] 使用脱敏真实格式样本补充至少一个回归用例。

**Dependencies：** Checkpoint A。

**Files likely touched：**

- `src/shared/domain/source.ts`
- `src/server/services/normalize-source.ts`
- `tests/unit/normalize-source.test.ts`

**Estimated scope：** S，3 个文件。

### Task 10：实现来源 API

**Description：** 实现来源聚合、搜索、排序和分页 API，返回 Skill、已归属和孤立数量。

**Acceptance criteria：**

- [x] 来源以规范化标识聚合，不修改原数据库字段。
- [x] 支持名称搜索、名称和 Skill 数量排序、分页。
- [x] 排序字段经过白名单映射，不拼接未校验输入。

**Verification：**

- [x] 先观察来源 API 测试失败，再实现至通过。
- [x] `bun test tests/integration/sources-api.test.ts` 通过。
- [x] `bun run openapi:check` 通过。

**Dependencies：** Task 9。

**Files likely touched：**

- `src/shared/contracts/sources.ts`
- `src/server/repositories/source-repository.ts`
- `src/server/services/source-service.ts`
- `src/server/routes/source-route.ts`
- `tests/integration/sources-api.test.ts`

**Estimated scope：** M，5 个文件。

### Task 11：实现来源清单与详情页面

**Description：** 完成来源列表与由来源数据加过滤 Skill 列表组成的详情页面，不新增重复后端端点。

**Acceptance criteria：**

- [x] 来源列表支持搜索、排序、分页和安全外链。
- [x] 来源详情展示指标，并生成语义正确、可恢复的 Skill 过滤 URL；实际结果由 Task 15 接通。
- [x] URL-safe 来源标识可刷新和返回恢复。

**Verification：**

- [x] `bun run typecheck` 通过。
- [x] `bun run test:e2e -- e2e/sources.spec.ts` 通过。
- [x] 非 HTTP/HTTPS 来源只按文本展示，不生成危险链接。

**Dependencies：** Task 10。完整 Skill 下钻由 Task 15 接通，不阻塞本任务完成来源清单和详情壳。

**Files likely touched：**

- `src/web/api/source-api.ts`
- `src/web/views/SourcesView.vue`
- `src/web/views/SourceDetailView.vue`
- `src/web/router/index.ts`
- `e2e/sources.spec.ts`

**Estimated scope：** M，5 个文件。

### Task 12：实现场景 API

**Description：** 实现场景搜索、排序、分页及 Skill 数量聚合，保持场景完全只读。

**Acceptance criteria：**

- [x] 默认按 `sort_order`、名称稳定排序。
- [x] 支持名称搜索和分页。
- [x] 没有任何新增、编辑或删除场景端点。

**Verification：**

- [x] 先观察场景 API 测试失败，再实现至通过。
- [x] `bun test tests/integration/scenarios-api.test.ts` 通过。
- [x] OpenAPI 中不存在场景写操作。

**Dependencies：** Checkpoint A。

**Files likely touched：**

- `src/shared/contracts/scenarios.ts`
- `src/server/repositories/scenario-repository.ts`
- `src/server/services/scenario-service.ts`
- `src/server/routes/scenario-route.ts`
- `tests/integration/scenarios-api.test.ts`

**Estimated scope：** M，5 个文件。

### Task 13：实现场景清单与详情页面

**Description：** 完成场景列表和由场景数据加过滤 Skill 列表组成的详情页面，界面不提供场景管理入口。

**Acceptance criteria：**

- [x] 场景列表展示名称、描述、图标、排序值和 Skill 数量。
- [x] 场景详情生成语义正确、可恢复的 Skill 过滤 URL；实际结果由 Task 15 接通。
- [x] 页面不存在新增、编辑或删除场景按钮。

**Verification：**

- [x] `bun run typecheck` 通过。
- [x] `bun run test:e2e -- e2e/scenarios.spec.ts` 通过。
- [x] 窄屏下内容不横向溢出且操作仍可用。

**Dependencies：** Task 12。完整 Skill 下钻由 Task 15 接通，不阻塞本任务完成场景清单和详情壳。

**Files likely touched：**

- `src/web/api/scenario-api.ts`
- `src/web/views/ScenariosView.vue`
- `src/web/views/ScenarioDetailView.vue`
- `src/web/router/index.ts`
- `e2e/scenarios.spec.ts`

**Estimated scope：** M，5 个文件。

## Checkpoint B：目录浏览可用

- [x] Tasks 7-13 全部完成。
- [x] `bun run verify` 通过。
- [x] 概览、来源和场景流程通过 E2E。
- [x] 来源规范化回归测试覆盖实际数据格式。
- [x] 用户确认目录浏览后继续 Phase 3。

## Phase 3：Skill 浏览与详情

### Task 14：实现 Skill 列表 API

**Description：** 实现关键词、来源多选、场景多选、孤立筛选、白名单排序和分页查询。

**Acceptance criteria：**

- [x] 同维度多选为“或”，来源与场景跨维度为“且”。
- [x] 孤立筛选只返回没有 `scenario_skills` 记录的 Skill。
- [x] 返回多个场景，分页计数不因关联 join 重复。

**Verification：**

- [x] 先观察 Skill 列表 API 测试失败，再实现至通过。
- [x] `bun test tests/integration/skills-list-api.test.ts` 通过。
- [x] 测试覆盖空筛选、多选组合、孤立、排序和分页边界。

**Dependencies：** Task 10、Task 12。

**Files likely touched：**

- `src/shared/contracts/skills-list.ts`
- `src/server/repositories/skill-list-repository.ts`
- `src/server/services/skill-list-service.ts`
- `src/server/routes/skill-list-route.ts`
- `tests/integration/skills-list-api.test.ts`

**Estimated scope：** M，5 个文件。

### Task 15：实现 Skill 列表页面

**Description：** 完成统一 Skill 表格、描述摘要、场景标签、搜索、多选筛选、排序和分页，并把查询状态写入 URL。

**Acceptance criteria：**

- [x] 列表展示 PRD 要求字段和明确的未归属状态。
- [x] 更改条件回到第一页，清空条件入口可用。
- [x] 刷新、后退和从详情返回能恢复查询条件。

**Verification：**

- [x] `bun run typecheck` 通过。
- [x] `bun run test:e2e -- e2e/skills-list.spec.ts` 通过。
- [x] 来源和场景详情的占位跳转接入真实过滤列表。

**Dependencies：** Task 11、Task 13、Task 14。

**Files likely touched：**

- `src/web/api/skill-api.ts`
- `src/web/views/SkillsView.vue`
- `src/web/components/SkillFilters.vue`
- `src/web/router/index.ts`
- `e2e/skills-list.spec.ts`

**Estimated scope：** M，5 个文件。

### Task 16：实现 Skill 详情 API

**Description：** 返回 `skills` 全部字段、规范化来源和当前场景归属，正确处理空值、长文本和不存在。

**Acceptance criteria：**

- [x] PRD 列出的全部字段均出现在契约和响应中。
- [x] 场景按稳定顺序返回。
- [x] 不存在返回 `SKILL_NOT_FOUND`，不返回内部 SQL。

**Verification：**

- [x] 先观察 Skill 详情 API 测试失败，再实现至通过。
- [x] `bun test tests/integration/skill-detail-api.test.ts` 通过。
- [x] 字段覆盖检查与 OpenAPI example 通过。

**Dependencies：** Task 14。

**Files likely touched：**

- `src/shared/contracts/skill-detail.ts`
- `src/server/repositories/skill-detail-repository.ts`
- `src/server/services/skill-detail-service.ts`
- `src/server/routes/skill-detail-route.ts`
- `tests/integration/skill-detail-api.test.ts`

**Estimated scope：** M，5 个文件。

### Task 17：实现 Skill 详情页面

**Description：** 展示所有 Skill 字段、完整可复制文本和当前场景归属，为后续编辑入口预留明确位置。

**Acceptance criteria：**

- [x] 所有字段可见，空值有一致占位，长路径和哈希可复制。
- [x] 多场景和未归属状态清晰。
- [x] 返回列表保留原筛选、排序和分页条件。

**Verification：**

- [x] `bun run typecheck` 通过。
- [x] `bun run test:e2e -- e2e/skill-detail.spec.ts` 通过。
- [x] 验证长文本不会破坏桌面和窄屏布局。

**Dependencies：** Task 15、Task 16。

**Files likely touched：**

- `src/web/views/SkillDetailView.vue`
- `src/web/components/SkillFieldList.vue`
- `src/web/components/CopyableValue.vue`
- `src/web/router/index.ts`
- `e2e/skill-detail.spec.ts`

**Estimated scope：** M，5 个文件。

## Checkpoint C：只读核心完成

- [x] Tasks 14-17 全部完成。
- [x] `bun run verify` 通过。
- [x] Skill 列表和详情 E2E 通过。
- [x] PRD 所有只读验收项可追踪到测试。
- [x] 用户确认只读核心后继续 Phase 4。

## Phase 4：比对与唯一写操作

### Task 18：实现集合比对领域逻辑

**Description：** 实现共有、仅左、仅右和对称差的纯领域计算，固定空集合、相同集合和重复输入语义。

**Acceptance criteria：**

- [x] 四种结果与数学集合语义一致。
- [x] 相同集合、空集合和无差异不抛异常。
- [x] 交换左右集合后左右差异正确互换。

**Verification：**

- [x] 先观察集合测试失败，再实现至通过。
- [x] `bun test tests/unit/compare-skill-sets.test.ts` 通过。

**Dependencies：** Task 14。

**Files likely touched：**

- `src/shared/domain/skill-comparison.ts`
- `src/server/services/compare-skill-sets.ts`
- `tests/unit/compare-skill-sets.test.ts`

**Estimated scope：** S，3 个文件。

### Task 19：实现 Skill 比对 API

**Description：** 实现 `compareSkills` 契约和 API，支持来源或场景作为任一侧操作数，并对结果进行搜索、排序和分页。

**Acceptance criteria：**

- [x] 支持来源—来源、场景—场景、来源—场景组合。
- [x] 返回左右总数、四种结果数和当前分页明细。
- [x] 操作数不存在或请求不合法得到稳定错误。

**Verification：**

- [x] 先观察比对 API 测试失败，再实现至通过。
- [x] `bun test tests/integration/skill-comparison-api.test.ts` 通过。
- [x] `bun run openapi:check` 通过。

**Dependencies：** Task 10、Task 12、Task 18。

**Files likely touched：**

- `src/shared/contracts/skill-comparison.ts`
- `src/server/repositories/skill-comparison-repository.ts`
- `src/server/services/skill-comparison-service.ts`
- `src/server/routes/skill-comparison-route.ts`
- `tests/integration/skill-comparison-api.test.ts`

**Estimated scope：** M，5 个文件。

### Task 20：实现比对工作台

**Description：** 提供左右操作数选择、结果数量、四种视图、交换操作、搜索排序和详情跳转，并用 URL 保存状态。

**Acceptance criteria：**

- [x] 来源和场景均可作为左右操作数。
- [x] 切换视图和进入详情不会丢失比对条件。
- [x] 相同、空集合和无差异均显示可解释空态。

**Verification：**

- [x] `bun run typecheck` 通过。
- [x] `bun run test:e2e -- e2e/skill-comparison.spec.ts` 通过。
- [x] 验证交换左右后计数与标签同步变化。

**Dependencies：** Task 15、Task 19。

**Files likely touched：**

- `src/web/api/skill-comparison-api.ts`
- `src/web/views/SkillComparisonView.vue`
- `src/web/components/ComparisonOperand.vue`
- `src/web/router/index.ts`
- `e2e/skill-comparison.spec.ts`

**Estimated scope：** M，5 个文件。

### Task 21：实现归属调整事务与 API

**Description：** 实现 `replaceSkillScenarios` 契约、expected 集合冲突检查和 `bun:sqlite` 即时事务，保证最小差异写入与整体回滚。

**Acceptance criteria：**

- [x] 增加、删除、同时增删和无变化语义正确。
- [x] Skill、场景不存在，expected 不一致、数据库锁定和只读得到稳定错误。
- [x] 失败整体回滚，快照证明非 `scenario_skills` 表完全不变。

**Verification：**

- [x] 先观察归属事务测试失败，再实现至通过。
- [x] `bun test tests/integration/skill-assignment-api.test.ts` 通过。
- [x] 测试检查 `skills`、`scenarios` 及其他 fixture 表未变化。

**Dependencies：** Task 16。

**Files likely touched：**

- `src/shared/contracts/skill-assignment.ts`
- `src/server/repositories/skill-assignment-repository.ts`
- `src/server/services/skill-assignment-service.ts`
- `src/server/routes/skill-assignment-route.ts`
- `tests/integration/skill-assignment-api.test.ts`

**Estimated scope：** M，5 个文件。

### Task 22：实现归属调整交互

**Description：** 在 Skill 详情提供现有场景多选、变更摘要、二次确认和保存反馈，处理只读、锁定和冲突。

**Acceptance criteria：**

- [x] 无实际变化时不能提交。
- [x] 保存前显示待新增和待移除场景，用户取消不写入。
- [x] 成功后详情、列表、场景和概览数据可刷新；冲突提示用户重新加载。

**Verification：**

- [x] `bun run typecheck` 通过。
- [x] `bun run test:e2e -- e2e/skill-assignment.spec.ts` 通过。
- [x] E2E 使用隔离 fixture，并在测试后比较数据库快照。

**Dependencies：** Task 17、Task 21。

**Files likely touched：**

- `src/web/api/skill-assignment-api.ts`
- `src/web/components/SkillAssignmentDialog.vue`
- `src/web/views/SkillDetailView.vue`
- `e2e/skill-assignment.spec.ts`

**Estimated scope：** M，4 个文件。

## Checkpoint D：核心业务完成

- [x] Tasks 18-22 全部完成。
- [x] `bun run verify` 通过。
- [x] 比对与归属调整 E2E 通过。
- [x] 写入快照验证只改变 `scenario_skills`。
- [x] 用户确认核心业务后继续 Phase 5。

## Phase 5：韧性、分发与交付

### Task 23：统一服务端错误与写边界防护

**Description：** 集中映射 SQLite、配置和领域错误，增加写边界回归测试，确保任何未授权写路径都会失败。

**Acceptance criteria：**

- [x] 所有 API 错误使用统一结构和规格错误码。
- [x] 日志和响应不泄露 SQL、堆栈或完整数据库路径。
- [x] 自动化扫描或测试证明只有归属 repository 含写语句。

**Verification：**

- [x] `bun test tests/integration/error-api.test.ts` 通过。
- [x] `bun test tests/integration/write-boundary.test.ts` 通过。
- [x] `bun run lint` 通过。

**Dependencies：** Task 21。

**Files likely touched：**

- `src/shared/contracts/errors.ts`
- `src/server/middleware/error-handler.ts`
- `src/server/database/sqlite-error-map.ts`
- `tests/integration/error-api.test.ts`
- `tests/integration/write-boundary.test.ts`

**Estimated scope：** M，5 个文件。

### Task 24：统一前端错误、重试与窄屏体验

**Description：** 抽取统一请求状态和错误展示，核对所有页面的加载、空、无结果、错误、只读、锁定和冲突状态，并完成窄屏回归。

**Acceptance criteria：**

- [x] 所有数据页面使用统一状态组件或一致模式。
- [x] 可重试错误提供重试入口，不可恢复错误提供配置指引。
- [x] 关键页面在桌面和窄屏 viewport 无阻断性溢出。

**Verification：**

- [x] `bun run typecheck` 通过。
- [x] `bun run test:e2e -- e2e/error-states.spec.ts` 通过。
- [x] `bun run test:e2e -- e2e/responsive.spec.ts` 通过。

**Dependencies：** Task 22、Task 23。

**Files likely touched：**

- `src/web/components/RequestState.vue`
- `src/web/composables/use-api-request.ts`
- `src/web/api/api-client.ts`
- `e2e/error-states.spec.ts`
- `e2e/responsive.spec.ts`

**Estimated scope：** M，5 个文件。

### Task 25：实现生产静态服务与单文件打包

**Description：** 让 Bun 服务提供构建后的 Vue 静态资源，并生成当前平台单文件可执行程序；数据库路径仍由外部环境变量提供。

**Acceptance criteria：**

- [x] `bun run build` 生成前端和服务端产物。
- [x] `bun run start` 同源提供前端和 `/api/v1`。
- [x] `bun run package` 生成 macOS 可执行文件，运行时不内嵌数据库或 `.env`。

**Verification：**

- [x] `bun run build` 通过。
- [x] `bun test tests/integration/static-serving.test.ts` 通过。
- [x] 在临时目录运行可执行文件并完成状态 API 与首页 smoke。

**Dependencies：** Task 24。

**Files likely touched：**

- `scripts/package.ts`
- `src/server/static-assets.ts`
- `package.json`
- `tests/integration/package-smoke.test.ts`
- `tests/integration/static-serving.test.ts`

**Estimated scope：** M，5 个文件。

### Task 26：同步仓库入口和项目事实文档

**Description：** 将实际启动、验证、契约、目录、端别边界和分发方式同步到仓库入口文档，删除初始化阶段的过时描述。

**Acceptance criteria：**

- [x] README 提供真实安装、配置、开发、验证和打包命令。
- [x] AGENTS 保持短小，只路由到事实、模块文档和验证入口。
- [x] project-specs 与实际技术栈、模块状态和端别边界一致。

**Verification：**

- [x] 文档中的每条命令均实际执行或明确标注用途。
- [x] `git diff --check` 通过。
- [x] 文档链接检查无失效本地路径。

**Dependencies：** Task 25。

**Files likely touched：**

- `README.md`
- `AGENTS.md`
- `docs/project-specs/overview.md`
- `docs/project-specs/module-inventory.md`
- `docs/modules/skills-manager-explorer/openapi/README.md`

**Estimated scope：** M，5 个文件。

### Task 27：执行完整验收并固化证据

**Description：** 执行完整质量门禁、覆盖率、macOS E2E、分发物 smoke 和可选真实库只读 smoke，逐项映射 PRD 验收标准并记录未跑项。

**Acceptance criteria：**

- [x] `bun run verify`、覆盖率和 E2E 达标。
- [x] PRD 每项验收标准有对应测试或人工证据。
- [x] 计划、TODO、PRD 和规格状态更新为与实际结果一致，不虚报完成。

**Verification：**

- [x] `bun run verify` 通过。
- [x] `bun test --coverage` 达到规格阈值。
- [x] `bun run test:e2e` 在 macOS 通过。
- [x] 可执行文件 smoke 通过。
- [x] 真实数据库只读 smoke 已执行，或在验收记录中明确说明未执行与风险。

**Dependencies：** Task 26。

**Files likely touched：**

- `docs/modules/skills-manager-explorer/test/技能管家浏览器-verify-local-fullstack-1.0.1.md`
- `docs/modules/skills-manager-explorer/prd/skills-manager-explorer-prd-1.0.md`
- `docs/modules/skills-manager-explorer/spec/skills-manager-explorer-spec-1.0.md`
- `docs/modules/skills-manager-explorer/exec-plans/技能管家浏览器-plan-local-fullstack-1.0.1.md`
- `docs/modules/skills-manager-explorer/exec-plans/技能管家浏览器-todo-local-fullstack-1.0.1.md`

**Estimated scope：** M，5 个文件。

## Checkpoint E：可交付

- [x] Tasks 23-27 全部完成。
- [x] 项目级 Definition of Done 全部满足。
- [x] 未完成项、未跑项和剩余风险已写入验收记录。
- [x] 交付结果已提交用户验收。

## 执行记录

> 每完成一个任务追加：日期、任务号、实际命令及结果、变更文件、未跑项、剩余风险。不要用聊天记录替代本节。

### 2026-07-17

- Tasks 1-6：完成 Bun 工具链、Vue/Vite/Hono 骨架、数据库兼容、Zod/OpenAPI/Prism、状态 API 与响应式应用壳。验证：冻结安装、类型、lint、构建、5 项基础测试和 2 项状态 E2E 通过。
- Tasks 7-17：完成概览、来源规范化、来源/场景目录、Skill 组合筛选与全字段详情。验证：目录集成测试、来源表驱动测试及对应浏览器流程通过。
- Tasks 18-22：完成集合比对与唯一写操作。验证：集合单元测试、混合操作数 API、归属增删、冲突、不存在、锁定、只读和快照回滚测试通过；二次确认 E2E 通过。
- Tasks 23-25：完成统一错误、写边界、窄屏、静态同源服务与 macOS 单文件程序。验证：单文件临时数据库 smoke 通过。
- Tasks 26-27：同步 README、AGENTS、project-specs、OpenAPI 和验收记录。最终结果：31 项单元/集成测试、11 项 Chromium E2E、函数覆盖率 98% 以上、行覆盖率 96% 以上。
- 真实数据库只读 smoke：45 Skills、8 来源、4 场景、13 未归属；执行前后哈希一致。
- 未完成外部验证：`bun audit` 因当前包源接口返回 HTTP 404 未取得结果；详见验收记录。`core-js` 非必要 postinstall 保持阻止。
