# 技能管家浏览器

一个由 Bun 驱动的本地全栈 Web 应用，用于浏览、筛选和比较 Skills Manager 数据，并安全调整单个 Skill 的场景归属。

## 环境要求

- macOS（1.0 必验平台）
- Bun 1.3.14 或更高兼容版本
- 已存在的 Skills Manager SQLite 数据库

项目不需要 Node.js，不执行数据库迁移，也不会创建 Skills Manager 业务表。

## 开始使用

```bash
bun install --frozen-lockfile
cp .env.sample .env
```

编辑 `.env`，把 `SKILLS_MANAGER_DB` 改为你自己的数据库绝对路径，然后启动开发环境：

```bash
bun run dev
```

- 网页：http://127.0.0.1:5173
- 本地 API：http://127.0.0.1:4173/api/v1/status

服务只允许监听本机回环地址。`.env` 和数据库文件已被 Git 忽略。

## 功能

- 概览 Skill、归一化来源、场景和未归属 Skill 数量。
- 搜索、排序、分页浏览来源、场景和 Skill。
- 以 URL 保存筛选条件，支持刷新、后退和详情返回。
- 比较任意两个来源或场景的共有、左右独有与对称差。
- 查看 Skill 全字段详情。
- 经二次确认和乐观冲突检查，原子调整单个 Skill 的场景归属。

场景本身和 Skill 数据均只读；唯一写入范围是 `scenario_skills`。

## 验证与契约

```bash
bun run verify
bun run test:coverage
bun run test:e2e
```

OpenAPI 由共享 Zod 契约生成：

```bash
bun run openapi:generate
bun run openapi:lint
bun run openapi:check
bun run mock
```

Prism 默认监听 http://127.0.0.1:4010，仅用于契约驱动的页面开发。

## 生产运行与打包

```bash
bun run build
bun run start
```

生产服务在同一端口提供前端和 `/api/v1`。生成当前 macOS 平台单文件程序：

```bash
bun run package
```

产物位于 `dist/skills-manager-browser`，数据库路径仍从运行目录的环境变量读取，不会嵌入程序。

## 文档

- [产品需求](docs/modules/skills-manager-browser/prd/skills-manager-browser-prd-1.0.md)
- [技术规格](docs/modules/skills-manager-browser/spec/skills-manager-browser-spec-1.0.md)
- [实施计划](docs/modules/skills-manager-browser/exec-plans/技能管家浏览器-plan-local-fullstack-1.0.1.md)
- [OpenAPI](docs/modules/skills-manager-browser/openapi/README.md)
- [项目事实](docs/project-specs/overview.md)
