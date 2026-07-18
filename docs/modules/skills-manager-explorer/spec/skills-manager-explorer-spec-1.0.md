# 技能管家浏览器技术规格 1.0

## 1. 文档信息

| 项目     | 内容                                 |
| -------- | ------------------------------------ |
| 对应 PRD | `skills-manager-explorer-prd-1.0.md` |
| 规格版本 | 1.0                                  |
| 规格状态 | 已实施并通过验收                     |
| 当前门禁 | VERIFY/DELIVER；实施门禁已通过       |
| 编写日期 | 2026-07-17                           |

## 2. 前置假设

本规格基于以下假设编写；任一假设发生变化时，应先更新本规格，再生成计划和任务：

1. 单仓库同时承载 Vue 前端、Bun 本地服务、共享契约和测试。
2. 产品不包含登录、账号、团队云同步或远程访问能力。
3. 1.0 首先保证 macOS 可用，代码和构建方式不得主动阻断 Windows、Linux 后续支持。
4. 浏览器与本地服务通过 REST JSON API 通信，API 统一使用 `/api/v1` 前缀。
5. Skills Manager 拥有 SQLite 表结构；本项目不执行迁移、不创建业务表、不改变日志模式。
6. `scenario_skills` 是归属写入表；批量“添加到场景”还可在 `scenario_skill_tools` 中为新增归属写入显式禁用保护值。所有其他数据库表只读。Skills Manager 1.28.3 及以上存在完整同步元数据快照时，归属写入还必须同步对应的 `skills/.skills-manager/scenario-skills/` 关联文件，避免 GUI 启动重建时覆盖数据库变更或默认启用工作区。
7. 前端为桌面浏览器优先，同时保证窄屏下功能可用，不开发原生移动端。
8. 1.0 不引入 Pinia；查询条件保留在页面或组合式函数中，只有出现真实跨页面全局状态时才评估引入。
9. 依赖以本规格确定的主版本为基线，首次初始化时在 `package.json` 和 `bun.lock` 中锁定精确版本。

## 3. Objective

构建一个由 Bun 驱动的本地全栈 Web 应用，从用户通过 `SKILLS_MANAGER_DB` 指定的 Skills Manager SQLite 数据库读取 Skill、来源、场景及其关系，提供概览、浏览、筛选、集合比对和单个 Skill 场景归属调整。

成功结果包括：

- 团队成员克隆仓库、配置自己的数据库路径后即可运行。
- 用户无需理解 SQLite 或 SQL 即可完成 PRD 1.0 的全部核心任务。
- 读取路径默认只读，写入能力只存在于显式的场景归属事务中。
- API 契约、前端调用、Mock 和测试使用同一套 Schema 定义，不能发生字段漂移。
- 对数据库不存在、不兼容、只读、锁定和写入冲突均提供明确结果。

## 4. Tech Stack

以下版本是 2026-07-17 的初始化基线。创建 `package.json` 时锁定精确版本；升级必须单独验证并更新规格或决策记录。

| 层次            | 技术                | 初始化基线   | 用途                                        |
| --------------- | ------------------- | ------------ | ------------------------------------------- |
| 运行时与包管理  | Bun                 | 1.3.14       | TypeScript 运行、依赖安装、测试、构建和打包 |
| 前端            | Vue                 | 3.5.x        | 页面和组件                                  |
| 前端构建        | Vite                | 8.1.x        | 开发服务器与前端构建                        |
| UI              | Ant Design Vue      | 4.2.x        | 桌面端列表、筛选、弹窗和反馈组件            |
| 路由            | Vue Router          | 5.2.x        | 一级导航和详情页路由                        |
| 本地 API        | Hono                | 4.12.x       | Bun 上的 REST 路由和中间件                  |
| 输入输出 Schema | Zod                 | 4.4.x        | 配置、请求、响应和领域边界校验              |
| OpenAPI         | `@hono/zod-openapi` | 1.5.x        | 从 Zod 契约生成 OpenAPI                     |
| SQLite          | `bun:sqlite`        | 随 Bun       | 查询、参数绑定和事务                        |
| 语言            | TypeScript          | 6.0.x        | 前后端及共享契约                            |
| 类型检查        | `vue-tsc`           | 3.3.x        | Vue SFC 类型检查                            |
| 单元与集成测试  | `bun:test`          | 随 Bun       | 领域、数据库和 API 测试                     |
| 浏览器验收      | Playwright          | 初始化时锁定 | 核心用户流程和响应式检查                    |
| 契约校验        | Redocly CLI         | 2.39.x       | OpenAPI lint                                |
| 契约 Mock       | Prism CLI           | 5.15.x       | 基于 OpenAPI examples 的前端 Mock           |
| 国际化          | `vue-i18n`          | 9.14.x       | 中英双语、组合式 API、locale 资源与持久化   |

明确不采用：

- Node.js 作为运行时。
- Fastify、Express 或其他 Node.js 优先的 HTTP 框架。
- `better-sqlite3`、`sqlite3` 等第三方 SQLite 驱动。
- ORM 和数据库迁移框架。
- 第二套手写 Mock JSON。

## 5. Architecture

### 5.1 运行结构

```text
Browser
  │
  │ HTTP on 127.0.0.1
  ▼
Hono application on Bun
  ├── static web assets
  ├── /api/v1 contracts and routes
  ├── services
  ├── repositories
  └── database connections
          │
          ▼
  SKILLS_MANAGER_DB
```

开发环境由 Vite 提供前端热更新，并代理 `/api` 到 Bun 服务。发布环境由 Bun 服务提供构建后的前端静态资源与 API，避免开放宽泛 CORS。

### 5.2 模块职责

| 模块           | 职责                                             | 不得承担                          |
| -------------- | ------------------------------------------------ | --------------------------------- |
| `contracts`    | Zod 请求、响应、枚举、错误和 OpenAPI 元数据      | SQL、页面状态、数据库实体泄漏     |
| `routes`       | HTTP 参数解析、Schema 校验、状态码和统一错误映射 | 来源归一化、集合计算和事务细节    |
| `services`     | 来源归一化、筛选语义、集合比对和归属变更编排     | 拼接不受控 SQL、直接依赖页面组件  |
| `repositories` | 参数化 SQL、数据库行映射、事务内增删关联         | HTTP 响应、界面文案               |
| `database`     | 配置校验、连接模式、结构兼容检查和事务入口       | 自动迁移、修改数据库日志模式      |
| `web/api`      | 封装本地 API 调用并解析契约响应                  | 裸散落 `fetch`、自定义接口字段    |
| `web/views`    | 页面流程、查询条件和用户反馈                     | 直接访问 SQLite、充当最终权限边界 |

### 5.3 依赖方向

```text
contracts ← routes ← server entry
    ↑          ↓
    └──── services ← repositories ← database

contracts ← web/api ← web/views
```

共享契约不得反向依赖服务端或前端实现。

## 6. Configuration

### 6.1 环境变量

| 变量                | 必填 | 默认值      | 规则                                 |
| ------------------- | ---- | ----------- | ------------------------------------ |
| `SKILLS_MANAGER_DB` | 是   | 无          | Skills Manager SQLite 数据库绝对路径 |
| `HOST`              | 否   | `127.0.0.1` | 1.0 只允许回环地址；其他值启动失败   |
| `PORT`              | 否   | `4173`      | 本地服务端口，必须为有效 TCP 端口    |
| `VITE_PORT`         | 否   | `5173`      | Vite 开发服务器端口                  |
| `VITE_API_PORT`     | 否   | `4173`      | Vite 开发代理连接的本地服务端口      |
| `LOG_LEVEL`         | 否   | `info`      | `debug`、`info`、`warn`、`error`     |

### 6.2 配置校验

- 使用 Zod 在进程启动边界一次性校验环境变量。
- `.env`、`.env.local` 和真实数据库路径不得提交版本库。
- `.env.sample` 与 `.env.development.agent` 只提供变量说明和安全示例。
- 错误配置必须阻止服务进入正常监听状态，并输出不含数据库内容的修复提示。

## 7. Database Contract

### 7.1 必需表和字段

启动兼容性检查必须确认：

- `skills` 表及 PRD 详情需要的全部字段存在。
- `scenarios` 表包含 `id`、`name`、`description`、`icon`、`sort_order`、`created_at`、`updated_at`。
- `scenario_skills` 表包含 `scenario_id`、`skill_id`、`added_at`、`sort_order`，并能唯一表示一组场景与 Skill 关系。

允许数据库包含额外表和额外字段；额外内容不得导致兼容性检查失败。

### 7.2 连接策略

- 建立长期只读连接，负责所有概览、列表、详情和比对查询。
- 仅在归属写入路径建立或使用可写连接。
- 数据库文件必须已存在；任何连接均不得隐式创建数据库文件。
- 可写连接启用 `PRAGMA foreign_keys = ON` 和有限的 `busy_timeout`。
- 不执行 `PRAGMA journal_mode = WAL` 或其他持久化数据库模式修改。
- 关闭服务时显式关闭连接。

### 7.3 写事务

调整单个 Skill 归属时：

1. 请求同时提交目标 `scenarioIds` 与页面加载时的 `expectedScenarioIds`。
2. 服务端在事务开始后重新读取当前关联。
3. 当前关联与 `expectedScenarioIds` 不一致时返回 `ASSIGNMENT_CONFLICT`，不写入。
4. 校验 Skill 与所有场景存在。
5. 计算需要新增和删除的最小差异。
6. 使用 `bun:sqlite` 的即时事务完成全部增删。
7. 任一步失败时整体回滚。
8. 返回更新后的场景归属和变更摘要。

新增关联使用毫秒级 `added_at`。单条替换沿用数据库默认 `sort_order`；批量添加从目标场景当前最大 `sort_order` 后顺序追加。不得修改现有关联的 `added_at` 或 `sort_order`。

批量添加归属时，所有新增关联必须处于同一个即时事务中；新关联的 `sort_order` 从目标场景当前最大值后顺序追加。若数据库旁存在 `skills/.skills-manager/schema.json`、`skills/` 与 `scenarios/` 组成的完整元数据快照，则在事务提交前为新增关联原子创建 `scenario-skills/<scenarioId>/<skillId>.json`。文件写入失败时删除本次已创建文件并回滚全部数据库关联；不得覆盖 GUI 同时创建的既有元数据文件。

### 7.4 测试数据边界

- 自动化写入测试只能使用临时目录中的数据库 fixture。
- 禁止自动化测试向用户通过 `SKILLS_MANAGER_DB` 配置的真实数据库写入。
- 真实数据库只允许执行显式、人工触发的只读 smoke 检查。

## 8. API Contract

### 8.1 契约源与生成物

- `src/shared/contracts/` 中的 Zod Schema 是接口定义源。
- 从契约源生成并提交 `docs/modules/skills-manager-explorer/openapi/skills-manager-explorer-local-openapi.yaml`。
- OpenAPI YAML 是前端协作、Prism Mock 和契约评审入口，但属于生成物，禁止手工修改。
- CI 和本地校验必须重新生成契约并检查工作区无差异。
- OpenAPI examples 覆盖正常列表、空列表、详情、归属更新成功、数据库只读、数据库锁定和版本冲突。

### 8.2 通用规则

- API 前缀：`/api/v1`。
- JSON 字段使用 `camelCase`。
- 数据库 ID 在 API 中统一表示为字符串。
- 数据库毫秒时间戳在 API 中保持整数，前端负责按本地时区格式化。
- 所有列表接口从第一版开始支持分页。
- 来源与场景列表默认分页：`page=1`、`pageSize=20`；最大 `pageSize=100`。
- Skill 列表使用 `pageSize=0` 表示不分页，默认值为 `0`；网页仅提供 20、50 与不分页三种选择。
- 排序只接受 Schema 枚举中的字段和 `asc`、`desc`，不得直接拼接用户输入。
- `GET /api/v1/skills` 的 `sort` 支持 `name`、`createdAt`、`updatedAt` 和 `status`；默认 `name asc`。

统一成功列表结构：

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

统一错误结构：

```json
{
  "error": {
    "code": "DATABASE_LOCKED",
    "message": "数据库正在被其他程序使用，请稍后重试",
    "details": {}
  }
}
```

### 8.3 端点

| 方法 | 路径                                 | `operationId`           | 用途                                       |
| ---- | ------------------------------------ | ----------------------- | ------------------------------------------ |
| GET  | `/api/v1/status`                     | `getApplicationStatus`  | 数据库连接、兼容性和可写能力               |
| GET  | `/api/v1/overview`                   | `getOverview`           | 概览指标                                   |
| GET  | `/api/v1/sources`                    | `listSources`           | 来源聚合列表                               |
| GET  | `/api/v1/scenarios`                  | `listScenarios`         | 场景列表                                   |
| GET  | `/api/v1/skills`                     | `listSkills`            | Skill 搜索、筛选、排序、重复归属筛选和分页 |
| GET  | `/api/v1/skills/{skillId}`           | `getSkill`              | Skill 全字段详情和场景归属                 |
| POST | `/api/v1/skill-comparisons`          | `compareSkills`         | 两个来源或场景集合的比较                   |
| PUT  | `/api/v1/skills/{skillId}/scenarios` | `replaceSkillScenarios` | 原子替换单个 Skill 场景归属                |
| POST | `/api/v1/skills/bulk-add-scenarios`  | `bulkAddSkillScenarios` | 批量把若干场景**加**入若干 Skill（不替换） |

来源详情页和场景详情页由来源或场景列表数据加已过滤的 Skill 列表组成，不新增重复详情端点。

### 8.4 错误码

| HTTP 状态 | 错误码                         | 条件                                                |
| --------- | ------------------------------ | --------------------------------------------------- |
| 400       | `VALIDATION_ERROR`             | 查询、路径或请求体不合法                            |
| 404       | `SKILL_NOT_FOUND`              | Skill 不存在                                        |
| 404       | `SCENARIO_NOT_FOUND`           | 提交的场景不存在                                    |
| 409       | `ASSIGNMENT_CONFLICT`          | 归属自页面加载后已被其他进程修改                    |
| 409       | `DATABASE_LOCKED`              | 数据库正在被其他进程占用                            |
| 422       | `DATABASE_SCHEMA_INCOMPATIBLE` | 必需表或字段不兼容                                  |
| 503       | `DATABASE_UNAVAILABLE`         | 数据库缺失、不可读或连接失败                        |
| 503       | `DATABASE_READ_ONLY`           | 用户尝试写入只读数据库                              |
| 503       | `METADATA_WRITE_FAILED`        | Skills Manager 关联元数据无法落盘，数据库事务已回滚 |
| 500       | `INTERNAL_ERROR`               | 未预期错误，不返回堆栈和 SQL                        |

## 9. Frontend Contract

### 9.1 页面路由

| 路径                     | 页面                                    |
| ------------------------ | --------------------------------------- |
| `/`                      | 概览                                    |
| `/sources`               | 来源清单                                |
| `/sources/:sourceId`     | 来源详情；`sourceId` 使用 URL-safe 编码 |
| `/scenarios`             | 场景清单                                |
| `/scenarios/:scenarioId` | 场景详情                                |
| `/skills`                | Skill 清单                              |
| `/skills/:skillId`       | Skill 详情和场景归属调整                |
| `/compare`               | 来源与场景比对                          |

### 9.2 状态管理

- 页面查询条件存放于路由查询参数，使刷新和返回可恢复。
- 页面局部编辑状态保留在组件内。
- API 访问统一经过 `src/web/api/`，页面不得直接散落 `fetch`。
- 不为 1.0 引入 Pinia；如果后续出现真实的跨页面全局状态，先更新本规格并获得批准。

### 9.3 页面状态

每个数据页面必须显式处理：

- 首次加载。
- 正常有数据。
- 正常空数据。
- 搜索或筛选无结果。
- 数据库不可用。
- 数据库结构不兼容。
- 请求失败和重试。

写入页面额外处理保存中、保存成功、只读、锁定和归属冲突。

## 10. Commands

以下命令是实施后必须存在的稳定入口：

| 目的                   | 命令                            |
| ---------------------- | ------------------------------- |
| 安装依赖               | `bun install --frozen-lockfile` |
| 首次安装或更新锁文件   | `bun install`                   |
| 同时启动前端和本地服务 | `bun run dev`                   |
| 仅启动 Vite            | `bun run dev:web`               |
| 仅启动 Bun 服务        | `bun run dev:server`            |
| 类型检查               | `bun run typecheck`             |
| 代码检查               | `bun run lint`                  |
| 格式检查               | `bun run format:check`          |
| 单元和集成测试         | `bun test`                      |
| 覆盖率测试             | `bun test --coverage`           |
| 生成 OpenAPI           | `bun run openapi:generate`      |
| 校验 OpenAPI           | `bun run openapi:lint`          |
| 检查契约漂移           | `bun run openapi:check`         |
| 启动 Prism Mock        | `bun run mock`                  |
| 构建前端和服务端       | `bun run build`                 |
| 启动构建产物           | `bun run start`                 |
| 浏览器验收             | `bun run test:e2e`              |
| 完整提交前验证         | `bun run verify`                |
| 生成当前平台可执行文件 | `bun run package`               |

`bun run verify` 至少串联格式检查、lint、类型检查、契约漂移检查、单元/集成测试和构建；浏览器验收可作为独立较慢门禁。

## 11. Project Structure

```text
.
├── index.html
├── package.json
├── bun.lock
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── server/
│   │   ├── index.ts
│   │   ├── config/
│   │   ├── database/
│   │   ├── repositories/
│   │   ├── routes/
│   │   └── services/
│   ├── shared/
│   │   ├── contracts/
│   │   └── domain/
│   └── web/
│       ├── api/
│       ├── components/
│       ├── composables/
│       ├── router/
│       ├── styles/
│       ├── views/
│       ├── App.vue
│       └── main.ts
├── scripts/
│   ├── generate-openapi.ts
│   └── verify-openapi-drift.ts
├── tests/
│   ├── fixtures/
│   ├── integration/
│   └── unit/
├── e2e/
├── docs/
│   ├── modules/skills-manager-explorer/
│   │   ├── openapi/
│   │   ├── prd/
│   │   │   └── skills-manager-explorer-prd-1.0.md
│   │   └── spec/
│   │       └── skills-manager-explorer-spec-1.0.md
│   └── project-specs/
└── dist/
```

规则：

- 不预建没有内容的目录。
- 页面局部组件优先放在对应页面目录内，真实跨页面复用后再提升到公共组件目录。
- `dist/` 和生成的临时报告不提交版本库。
- OpenAPI YAML 提交版本库，但必须标明生成来源并禁止手改。

## 12. Code Style

### 12.1 命名和格式

- TypeScript、Vue 使用严格模式，不使用无理由的 `any`。
- 变量和函数使用 `camelCase`，组件和类型使用 `PascalCase`，常量使用 `UPPER_SNAKE_CASE`。
- API、服务和测试围绕相同动作命名，例如 `replaceSkillScenarios`。
- 数据库字段只在 repository 映射层使用 `snake_case`，其余层使用 `camelCase`。
- 错误使用稳定错误码；中文文案不得充当程序判断条件。
- 遵循 ESLint 和 Prettier，不在代码评审中依赖个人格式偏好。

### 12.2 示例

```ts
const replaceSkillScenariosRoute = createRoute({
  method: "put",
  path: "/api/v1/skills/{skillId}/scenarios",
  request: {
    params: skillIdParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: replaceSkillScenariosInputSchema,
        },
      },
    },
  },
  responses: replaceSkillScenariosResponses,
});

app.openapi(replaceSkillScenariosRoute, (context) => {
  const { skillId } = context.req.valid("param");
  const input = context.req.valid("json");
  const result = skillAssignmentService.replace(skillId, input);

  return context.json(result, 200);
});
```

路由只负责边界校验和响应；事务、差异计算和冲突检查属于 service 与 repository。

## 13. Testing Strategy

### 13.1 测试层次

| 层次           | 工具                            | 重点                                            |
| -------------- | ------------------------------- | ----------------------------------------------- |
| 单元测试       | `bun:test`                      | 来源规范化、筛选语义、集合运算、错误映射        |
| 数据库集成测试 | `bun:test` + 临时 SQLite        | 兼容性检查、参数化查询、事务、回滚和冲突        |
| API 集成测试   | Hono `app.request` + `bun:test` | Schema、状态码、分页、错误结构和 OpenAPI 一致性 |
| 浏览器验收     | Playwright                      | 导航、列表、筛选、比对、详情和归属调整完整流程  |
| 真实库 smoke   | 人工只读命令                    | 使用用户数据库验证读取兼容性，禁止写入          |

### 13.2 测试要求

- 来源规范化、集合比对和归属事务必须先写失败测试再实现。
- 归属事务覆盖成功、新增、删除、无变化、场景不存在、并发冲突、数据库锁定和中途失败回滚。
- 列表测试覆盖分页边界、多个来源、多个场景、孤立 Skill、空值和异常时间戳。
- OpenAPI examples 必须能被 Prism 启动并返回页面开发所需数据。
- 核心领域和写入服务分支覆盖率不低于 90%；项目整体行覆盖率不低于 80%。
- E2E 不连接用户真实数据库，统一使用隔离 fixture。

### 13.3 验证检查点

- 基础骨架完成：配置、状态 API、契约生成、测试和构建均通过。
- 每个纵向功能切片完成：该功能的领域、API、页面和测试同时可运行。
- 写入功能完成：数据库副本校验只有 `scenario_skills` 发生预期变化。
- 交付前：`bun run verify` 与 `bun run test:e2e` 均通过。

## 14. Boundaries

### 14.1 Always do

- 先修改契约 Schema，再生成 OpenAPI，然后同步 API、页面、Mock 和测试。
- 所有外部输入在配置、HTTP 或数据库兼容边界校验。
- 所有 SQL 使用固定模板和参数绑定；排序字段通过枚举白名单映射。
- 写入只使用临时测试数据库，真实数据库的自动化检查保持只读。
- 每个任务完成时运行任务指定验证，并更新任务状态和证据。
- 提交前运行 `bun run verify`。

### 14.2 Ask first

- 修改 PRD、MVP 范围或本规格中的安全边界。
- 增加生产依赖、引入 Pinia或更换 UI、API、数据库框架。
- 增删 API 端点、改变字段、错误码、分页或排序语义。
- 修改 Skills Manager 数据库结构、索引、触发器、日志模式或非关联表数据。
- 增加局域网监听、远程访问、账号、鉴权或云同步。
- 改变 CI、发布方式或支持平台清单。

### 14.3 Never do

- 提交 `.env`、真实数据库、用户路径、Token 或本地敏感数据。
- 接受前端传入的 SQL、表名或未经白名单映射的排序字段。
- 在前端直接读取 SQLite。
- 写入 `skills`、`scenarios` 或其他非 `scenario_skills` 表。
- 自动迁移、自动创建或自动修复用户数据库。
- 通过测试、脚本或 Mock 修改用户真实数据库。
- 向浏览器返回 SQL、堆栈、完整数据库路径或内部异常对象。
- 默认监听 `0.0.0.0`。
- 手工修改生成的 OpenAPI YAML。

## 15. Success Criteria

本规格通过并完成实施后，必须满足：

- [x] Bun 版本、依赖精确版本和 `bun.lock` 已提交且可复现安装。
- [x] `bun run dev` 可同时启动网页和本地服务，服务只监听回环地址。
- [x] 有效数据库可读取；配置错误、缺表和只读能力可被准确诊断。
- [x] PRD 1.0 的概览、来源、场景、Skill、比对和归属调整全部可用。
- [x] 所有列表具备分页，搜索、筛选和排序语义与 PRD 一致。
- [x] 归属修改具备确认、乐观冲突检查、即时事务和完整回滚。
- [x] 自动化证明确认写操作只改变 `scenario_skills`。
- [x] Zod 契约、生成 OpenAPI、Prism Mock、API 实现和前端调用无漂移。
- [x] 所有页面覆盖加载、空、无结果和错误状态；写入页面覆盖只读、锁定和冲突。
- [x] `bun run verify` 与 `bun run test:e2e` 通过。
- [x] 不包含 PRD 明确排除的场景管理、Skill 管理、云同步和任意 SQL 能力。

## 16. 已确认决策

用户于 2026-07-17 批准本规格，并接受以下默认决策：

1. macOS 是 1.0 必验平台，Windows/Linux 保持代码可移植但不作为首批验收阻塞项。
2. 1.0 不引入 Pinia，直到出现真实的跨页面全局状态。
3. 单文件可执行程序属于交付阶段任务，不阻塞早期纵向功能切片。
4. Zod 是契约定义源，OpenAPI YAML 是生成并提交的评审与 Mock 产物。
5. 实施验证确认 `vue-tsc` 3.3.7 与 TypeScript 7.0.2 的编译器导出不兼容，因此将 TypeScript 固定为 6.0.3；待 Vue 工具链正式兼容 TypeScript 7 后再独立升级。
6. 1.0.2 计划批准：包名 / 模块目录 / 二进制同步重命名为 `skills-manager-explorer`；新增 `vue-i18n@9` 与中英双语；默认 `zh-CN`，`en-US` 可切换并持久化。详细边界与默认值见 1.0.2 plan `docs/modules/skills-manager-explorer/exec-plans/技能管家浏览器-plan-local-fullstack-1.0.2.md`。
7. 1.0.3 增量批准：Skills 列表多选 + “添加到场景”按钮（POST `/api/v1/skills/bulk-add-scenarios`，仅添加不替换）；每行场景归属列加“编辑”入口（弹窗内仍调用现有 `replaceSkillScenarios`）；场景归属列表列宽固定 80px。
8. Skills Manager 1.28.3 将场景归属同步元数据作为启动重建来源。批量添加必须同时持久化关联表与对应元数据文件，并为新增归属保存已知工作区工具的显式禁用值，阻止 GUI 将缺失开关默认启用；严禁修改当前场景、同步目标、项目、设置、审计记录或工作区文件。详见 `adrs/0001-persist-scenario-membership-metadata.md`。

## 13.4 国际化与命名规范

- 所有面向用户文案、错误提示、按钮、菜单、字段标签、空态 / 加载 / 错误态、确认弹窗、状态码中文展示统一抽取到 `src/web/i18n/locales/{zh-CN,en-US}.ts`；新增 key 时必须先在 `zh-CN.ts` 定义，再在 `en-US.ts` 用 `satisfies MessageSchema` 翻译。
- 切换语言不触碰路由状态、URL 与滚动位置；`<html lang>` 与 `i18n.global.locale` 由 `useLocale.setLocale` 统一刷新。
- 启动 locale 解析顺序：`localStorage.skillsManagerExplorer.locale` → `navigator.languages`（`zh-*` → `zh-CN`，`en-*` → `en-US`）→ `zh-CN` fallback。
- 日期时间、数字、客户端兜底排序全部走 `useLocale` 的 `formatDateTime` / `formatNumber` / `compareStrings`；服务端排序保留 `ORDER BY name COLLATE NOCASE` 兜底。
- i18n key 完整性由 `tests/unit/i18n-keys.test.ts` 在 `bun run verify` 中强制：缺失 en-US 翻译会导致构建失败。
- OpenAPI `info["x-locale-resources"]` 登记 `default` / `supported` / `sources` / `storageKey`，供前端与文档消费方使用。
- 仓库根目录路径与 `SKILLS_MANAGER_DB` 环境变量名 **不** 在 1.0.2 范围重命名。

## 17. Gate Decision

SPECIFY、PLAN、TASKS、IMPLEMENT 与 VERIFY 门禁均已通过，当前进入 DELIVER 阶段。
