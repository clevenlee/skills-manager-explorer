# 技能管家浏览器实施计划 1.0.1

## 1. 计划信息

| 项目         | 内容                                           |
| ------------ | ---------------------------------------------- |
| 对应 PRD     | `../prd/skills-manager-explorer-prd-1.0.md`    |
| 对应技术规格 | `../spec/skills-manager-explorer-spec-1.0.md`  |
| 配套 TODO    | `技能管家浏览器-todo-local-fullstack-1.0.1.md` |
| 计划状态     | 已完成                                         |
| 当前门禁     | VERIFY/DELIVER；全部检查点已通过               |
| 实施方式     | 单仓库、契约先行、测试先行、纵向切片           |

## 2. Overview

本计划把技能管家浏览器从仅有文档的初始化仓库，逐步建设为可运行、可测试和可分发的 Bun 全栈本地应用。实施顺序先验证最危险的配置、SQLite 兼容和契约生成链，再按“状态与概览—来源与场景—Skill 浏览—集合比对—归属写入”的用户价值顺序交付纵向切片，最后完成错误韧性、浏览器验收和单文件打包。

计划不包含 PRD 1.0 排除的场景管理、Skill 安装更新、批量归属、账号、云同步、远程访问或自定义 SQL。

## 3. Planning Basis

- 产品范围以 PRD 1.0 为准。
- 技术、接口、数据和安全边界以已批准技术规格 1.0 为准。
- Bun 1.3.14 是初始化基线；依赖在 Task 1 中锁定。
- 当前仓库没有 `package.json`、源码、测试或构建入口，所有实现从可验证最小骨架开始。
- `planning-and-task-breakdown` 引用的外部 Definition of Done 文件在本地技能目录中不存在，因此本计划在第 12 节内嵌项目级 Definition of Done，不依赖缺失文件。

## 4. Architecture Decisions

1. **单仓库、单包起步。** 前端、服务端、共享契约和测试在一个 `package.json` 下维护，避免初期工作区和发布复杂度。
2. **Bun 原生运行。** 使用 Bun 运行、包管理、测试、构建和 `bun:sqlite`，不保留 Node.js 或第三方 SQLite 驱动备用路径。
3. **Hono + Zod 契约先行。** 先定义 Zod Schema，再生成 OpenAPI，并让路由、前端 API、Prism 和测试依赖同一契约。
4. **无 ORM、无迁移。** repository 使用固定参数化 SQL；本项目不拥有 Skills Manager 数据库结构。
5. **读写能力隔离。** 只读连接承载浏览；可写连接只出现在 `replaceSkillScenarios` 路径。
6. **乐观冲突检查。** 写请求携带 `expectedScenarioIds`，即时事务内重读并比较后再写。
7. **路由参数承载查询状态。** 页面刷新、后退和详情返回可恢复筛选与比对条件，不引入 Pinia。
8. **Mac 必验、跨平台可移植。** 首版浏览器和打包验收在 macOS 完成，不写死平台路径分隔符或 shell 专属逻辑。

## 5. Dependency Graph

```text
Task 1 工具链
  └─ Task 2 可运行骨架
      ├─ Task 3 配置与数据库边界
      └─ Task 4 契约生成链
           └─ Task 5 状态 API
               └─ Task 6 应用壳与状态体验
                   ├─ Task 7-8 概览
                   ├─ Task 9-11 来源
                   └─ Task 12-13 场景
                        └─ Task 14-17 Skill 列表与详情
                             ├─ Task 18-20 集合比对
                             └─ Task 21-22 场景归属写入
                                  └─ Task 23-24 错误韧性
                                       └─ Task 25 打包与静态服务
                                            └─ Task 26-27 文档与最终验收
```

同一功能的后端任务先固定契约和测试，紧随其后的前端任务完成该纵向切片。不得先铺完全部后端再一次性连接前端。

## 6. Implementation Phases

### Phase 1：可验证基础

- [x] Task 1：初始化 Bun 工具链与质量脚本。
- [x] Task 2：建立 Vue/Vite/Hono 最小可运行骨架。
- [x] Task 3：建立配置、SQLite fixture 与结构兼容检查。
- [x] Task 4：建立 Zod → OpenAPI → Prism 契约链。
- [x] Task 5：实现应用状态 API。
- [x] Task 6：实现应用壳与数据库状态体验。

#### Checkpoint A：基础可用

- [x] `bun install --frozen-lockfile` 可复现。
- [x] `bun run dev` 同时启动前端和本地服务，服务仅监听回环地址。
- [x] 有效、缺失和不兼容数据库 fixture 均得到预期状态。
- [x] OpenAPI 可生成、lint、漂移检查并启动 Prism。
- [x] `bun run verify` 首次通过。

### Phase 2：概览与目录浏览

- [x] Task 7：实现概览 API。
- [x] Task 8：实现概览页面。
- [x] Task 9：实现来源规范化领域逻辑。
- [x] Task 10：实现来源 API。
- [x] Task 11：实现来源清单与详情页面。
- [x] Task 12：实现场景 API。
- [x] Task 13：实现场景清单与详情页面。

#### Checkpoint B：目录浏览可用

- [x] 概览数量与 fixture SQL 结果一致。
- [x] 来源归一化覆盖 URL、`.git`、查询参数、fallback 和未知来源。
- [x] 来源和场景可搜索、排序、分页，并能生成可恢复的 Skill 过滤 URL；实际列表结果在 Checkpoint C 接通。
- [x] 页面覆盖加载、空数据和无匹配结果。
- [x] 相关 API、单元、集成和 E2E 测试通过。

### Phase 3：Skill 浏览与详情

- [x] Task 14：实现 Skill 列表 API。
- [x] Task 15：实现 Skill 列表页面。
- [x] Task 16：实现 Skill 详情 API。
- [x] Task 17：实现 Skill 详情页面。

#### Checkpoint C：只读核心完成

- [x] 名称与描述搜索、来源多选、场景多选和孤立筛选语义正确。
- [x] 排序只接受白名单，分页边界正确。
- [x] Skill 详情展示全部字段、空值、长文本和多个场景。
- [x] 查询状态可通过 URL 恢复，详情返回后仍保留。
- [x] 所有只读 PRD 验收项已有自动化证据。

### Phase 4：比对与唯一写操作

- [x] Task 18：实现集合比对领域逻辑。
- [x] Task 19：实现 Skill 比对 API。
- [x] Task 20：实现比对工作台。
- [x] Task 21：实现归属调整事务与 API。
- [x] Task 22：实现归属调整交互。

#### Checkpoint D：核心业务完成

- [x] 来源—来源、场景—场景和来源—场景比较均正确。
- [x] 共有、仅左、仅右和对称差数量及分页明细正确。
- [x] 单个 Skill 归属更新具备确认、冲突检查和整体回滚。
- [x] 数据库快照证明只修改 `scenario_skills`。
- [x] 数据库锁定、只读、目标不存在和并发冲突均有稳定错误码。

### Phase 5：韧性、分发与交付

- [x] Task 23：统一服务端错误与写边界防护。
- [x] Task 24：统一前端错误、重试和窄屏体验。
- [x] Task 25：实现生产静态服务与单文件打包。
- [x] Task 26：同步仓库入口和项目事实文档。
- [x] Task 27：执行完整验收并固化证据。

#### Checkpoint E：可交付

- [x] `bun run verify` 通过。
- [x] `bun run test:e2e` 在 macOS 通过。
- [x] 核心领域与写入分支覆盖率达到 90%，整体行覆盖率达到 80%。
- [x] 当前平台单文件可执行程序可启动并读取外部 `.env` 数据库路径。
- [x] README、AGENTS、project-specs、OpenAPI、测试记录和交付状态一致。
- [x] PRD 1.0 的所有验收项均有通过证据或明确未通过原因。

## 7. Vertical Slice Rules

每个功能切片遵循以下顺序：

1. 写或更新 Zod 契约及 examples。
2. 生成 OpenAPI 并检查漂移。
3. 先写失败测试。
4. 实现领域、repository、service 和 route。
5. 实现统一 API 客户端与页面。
6. 补齐加载、空、错误和窄屏状态。
7. 运行该切片测试，再运行 `bun run verify`。

如果实现需要改变端点、字段、错误码、数据写边界、依赖或 PRD 范围，必须停止并先更新规格取得批准。

## 8. Verification Strategy

| 层次             | 每任务              | 每检查点                  | 最终                         |
| ---------------- | ------------------- | ------------------------- | ---------------------------- |
| 格式、lint、类型 | 改动相关命令        | `bun run verify`          | `bun run verify`             |
| 单元测试         | 指定测试文件        | 相关目录 + 覆盖率         | `bun test --coverage`        |
| SQLite 集成      | 相关 fixture 测试   | 全部数据库集成测试        | 全部通过并保存摘要           |
| API 契约         | 生成与相关 API 测试 | OpenAPI lint、漂移、Prism | 全部通过                     |
| 浏览器           | 相关 E2E 场景       | 该阶段完整流程            | `bun run test:e2e`           |
| 真实数据库       | 禁止自动写入        | 可选人工只读 smoke        | 人工只读 smoke，记录未跑风险 |

## 9. Risks and Mitigations

| 风险                                     | 影响                 | 等级 | 缓解措施                                        |
| ---------------------------------------- | -------------------- | ---- | ----------------------------------------------- |
| Bun/Vite/Vue 最新主版本组合不兼容        | 基础构建阻塞         | 高   | Task 1-2 最先验证；失败时停止并更新规格版本基线 |
| Bun 单文件打包与前端静态资源组合存在限制 | 分发方式受阻         | 中   | Task 25 独立验证；开发运行不依赖打包            |
| 团队数据库结构存在版本差异               | 某些成员无法使用     | 高   | Task 3 建立字段级兼容检查；收集脱敏表结构样本   |
| 来源规则误合并或重复                     | 筛选和比对错误       | 高   | Task 9 以真实格式 fixture 做表驱动测试          |
| Skills Manager 同时写数据库              | 锁定或覆盖变化       | 高   | `busy_timeout`、即时事务、expected 集合冲突检查 |
| 写入范围扩散                             | 用户数据风险         | 高   | 独立写 repository、SQL 白名单、全库快照差异测试 |
| OpenAPI 与实现漂移                       | 前后端和 Mock 不一致 | 高   | Zod 单一来源、生成物漂移检查、Prism smoke       |
| 任务横向铺开导致后期集成失败             | 返工                 | 中   | 按配对任务完成纵向切片，每个阶段设 E2E 检查点   |

## 10. Parallelization Opportunities

本计划默认单线程顺序实施；未经用户要求不启用多代理。若由多名工程师并行：

- Task 1-6 必须顺序完成，属于共享基础。
- Checkpoint A 后，来源切片 Task 9-11 与场景切片 Task 12-13 可并行，但共享契约改动需先协调。
- Skill 列表 Task 14-15 完成后，比对领域 Task 18 可与详情切片 Task 16-17 部分并行。
- 归属写入 Task 21-22 必须顺序实施并由同一负责人维护事务边界。
- Task 23-27 必须在核心功能合并后执行。

## 11. Change Control

- 任务执行过程中发现规格缺口：先更新技术规格并请求批准，再更新 plan/todo。
- PRD 范围变化：新增 PRD 版本，并让执行计划前两位随之变化。
- 仅实现细节变化且不影响契约与边界：记录在计划决策日志中。
- 每个任务完成后更新 TODO 勾选状态和验证证据，不以聊天结论替代文件记录。
- 不删除失败测试；若测试预期错误，先说明原因并修正规格或测试。

## 12. Project Definition of Done

一个任务只有同时满足以下条件才可勾选完成：

- [x] 任务验收条件全部满足。
- [x] 指定验证命令实际执行并记录结果。
- [x] 新行为有先失败后通过的测试，或说明为何不适用。
- [x] 相关 Zod、OpenAPI、Mock、API、页面和测试保持一致。
- [x] 没有写入真实用户数据库或扩大数据库写边界。
- [x] 没有新增未批准依赖、端点、错误码或产品范围。
- [x] 改动文件数与任务范围一致；超过约 5 个文件时先拆任务或记录批准理由。
- [x] 工作区原有用户改动未被覆盖。
- [x] TODO 已更新验证证据和剩余风险。

项目只有同时满足以下条件才可交付：

- [x] Checkpoint A-E 全部通过。
- [x] PRD、规格和 OpenAPI 验收项可追踪到测试。
- [x] `bun run verify`、覆盖率和 E2E 通过。
- [x] macOS 分发物通过干净环境 smoke。
- [x] 未跑项和剩余风险已写入测试或 handoff 记录。

## 13. Approval Gate

本计划与配套 TODO 已于 2026-07-17 获用户明确批准，当前进入 IMPLEMENT 阶段；实施时按 TODO 顺序逐项执行，不得把计划批准解释为扩大产品范围。
