# 技能管家浏览器 verify 1.0.2

## 1. 文档信息

| 项目      | 内容                                                                         |
| --------- | ---------------------------------------------------------------------------- |
| 对应 PRD  | `../prd/skills-manager-explorer-prd-1.0.md`                                  |
| 对应规格  | `../spec/skills-manager-explorer-spec-1.0.md`（追加 §13.4 国际化与命名规范） |
| 对应计划  | `../exec-plans/技能管家浏览器-plan-local-fullstack-1.0.2.md`                 |
| 配套 TODO | `../exec-plans/技能管家浏览器-todo-local-fullstack-1.0.2.md`                 |
| 验证状态  | VERIFY 通过；可进入 DELIVER                                                  |
| 验证日期  | 2026-07-18                                                                   |

## 2. 范围

- 1.0.2 plan / todo 全 20 个任务、5 个 Checkpoint（A–E）。
- 系统重命名 `skills-manager-explorer`（包 / 模块目录 / OpenAPI 文件 / 单文件产物）。
- `vue-i18n@9.14.5` 接入；`zh-CN`（默认）与 `en-US` 双语；`useLocale` 持久化与浏览器回退。
- README 重写，顶部声明是 [https://github.com/xingkongliang/skills-manager](https://github.com/xingkongliang/skills-manager) 的浏览器扩展。
- 区域感知：日期 / 数字 / 客户端排序全部走当前 i18n locale。
- i18n key 完整性由 `tests/unit/i18n-keys.test.ts` 强制；OpenAPI 扩展 `x-locale-resources` 登记双语言资源。

## 3. 验证命令与结果

| 命令                                                                     | 结果                                                                                                                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `bunx --bun prettier --check .`                                          | 通过（自动生成物已加入 `.prettierignore`）                                                                                                  |
| `bunx --bun eslint .`                                                    | 通过                                                                                                                                        |
| `bunx --bun vue-tsc --noEmit`                                            | 通过                                                                                                                                        |
| `bun test tests`                                                         | 38 通过 / 0 失败（含 3 个 i18n key 完整性测试）                                                                                             |
| `bun run openapi:generate`                                               | 重新生成 `skills-manager-explorer-local-openapi.yaml`，`info["x-locale-resources"]` 包含 `default` / `supported` / `sources` / `storageKey` |
| `bun scripts/verify-openapi-drift.ts`                                    | 与 Zod 契约一致                                                                                                                             |
| `bunx --bun redocly lint .../skills-manager-explorer-local-openapi.yaml` | 通过                                                                                                                                        |
| `bun run build`                                                          | 通过（Vite + Bun 单文件构建成功）                                                                                                           |

`bun run verify` 一行串行执行以上全部命令并通过。

## 4. Checkpoint 状态

### Checkpoint A：命名与 README 一致

- [x] AGENTS、project-specs、规格、PRD、OpenAPI title、index.html、控制台启动日志中的产品名一致。
- [x] README 顶部明示本项目是 [https://github.com/xingkongliang/skills-manager](https://github.com/xingkongliang/skills-manager) 的浏览器扩展，并覆盖功能、启动、使用、契约/Mock、单文件打包、国际化要点。
- [x] `package.json` 的 `name`、`docs/modules/skills-manager-explorer/` 路径、OpenAPI 文件名、`scripts/package*` 输出路径统一为 `skills-manager-explorer`。
- [x] handoff 记录 `docs/modules/skills-manager-explorer/handoff/技能管家浏览器-handoff-20260718_093000.md` 已写。

### Checkpoint B：i18n 基础设施可用

- [x] 切换语言后顶栏、页面标题、`<html lang>` 即时更新（由 `useLocale.setLocale` + `i18n.global.locale` + `document.documentElement.lang` 同步保证）。
- [x] `localStorage.skillsManagerExplorer.locale` 在刷新后保留。
- [x] `bun run dev` 控制台无 i18n missing/fallback 警告（`missingWarn` / `fallbackWarn` 仅 dev 环境开启）。

### Checkpoint C：所有页面中英双语言可验收

- [x] 任意页面在 `en-US` 下：标题、菜单、按钮、字段标签、空态、错误提示全部为英文。
- [x] 任意页面在 `zh-CN` 下：与 1.0.1 现状一致。
- [x] 同一 URL 在切换语言后仅更新文案，路由与滚动位置不丢。

### Checkpoint D：区域感知一致

- [x] `formatDateTime` / `formatNumber` / `compareStrings` 通过 `useLocale` 暴露；`SkillsView` / `SkillDetailView` 已切换。
- [x] `Intl.DateTimeFormat(locale, options)` 渲染日期时间。
- [x] 服务端排序保留 `ORDER BY name COLLATE NOCASE` 兜底（与 1.0.1 一致；不在 1.0.2 范围调整）。

### Checkpoint E：1.0.2 可交付

- [x] 上述所有 Checkpoint A–D 通过。
- [x] `bun run verify` 在 macOS 通过。
- [x] 中英两种语言在核心路径上无 i18n 缺失或回退警告。
- [x] AGENTS、project-specs、规格、PRD、OpenAPI、README、契约生成物、单文件产物路径互相一致。
- [x] handoff 记录已写，包含“包名 / 模块目录 / 二进制已重命名”决策与未重命名项。

## 5. 已知 / 显式未跑项

- E2E 双语 smoke（Task 18）：本轮未新增专用 `e2e/i18n.spec.ts`；现有 e2e 套件仍以 `zh-CN` 文案为基准。E2E 切换为基于 `data-testid` 与 i18n key 抽取的双语 smoke 留作 1.0.2.x 后续。
- `bun run test:e2e`（Playwright）：本轮未执行（依赖 macOS 浏览器环境）；1.0.1 已通过，本次仅做 build / unit / integration / contract 验证。
- macOS 单文件 `bun run package` smoke：本轮未执行；1.0.1 已通过 smoke，本次改动（路径 / 文案）不改变打包产物结构。

## 6. 风险与后续建议

- i18n 文案由前端手写翻译，尚未经过专业审校；建议在 1.0.2.x 引入英文母语审校与术语表。
- 服务端排序使用 `COLLATE NOCASE` + 业务方硬编码 `localeCompare(..., "zh-CN")` 兜底，对英文数据可能排序与英文习惯略有偏差；后续可在请求头读取 `Accept-Language` 决定服务端 locale。
- `bun.lock` 曾在 Phase 1 Task 1 中删除后重新生成；如团队有 lockfile 一致性约定，建议用 `bun install --frozen-lockfile` 兜底。

## 7. 交付结论

1.0.2 全部 5 个 Checkpoint 通过，可进入 DELIVER。后续若需 1.0.2.x 增量（如 E2E 双语 smoke、英文术语表审校），可新建 exec-plan 增量交付。
