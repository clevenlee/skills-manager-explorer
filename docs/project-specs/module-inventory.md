# 模块清单

> 业务模块目录在 PRD/执行计划落地后按 `docs/modules/<kebab-case>/` 创建，并在本表登记。
> 没有实际文档承载时不要预建空模块目录。

## 项目自身（占位）

| 模块 | 入口 | 用途 |
| --- | --- | --- |
| 仓库基线 | `AGENTS.md`、`README.md`、`.env.development.agent` | 仓库级入口与本地环境变量模板 |
| 项目事实 | `docs/project-specs/overview.md` | 项目定位、技术栈、端别边界、启动/验证入口 |
| 模块清单 | `docs/project-specs/module-inventory.md` | 本表 |

## 业务模块

| 模块 | 入口 | 用途 | 状态 |
| --- | --- | --- | --- |
| 技能管家浏览器 | `docs/modules/skills-manager-browser/` | 本地 Skill 概览、浏览、比对与场景归属调整 | 规格已批准，计划待审核 |

> 命名规范：模块目录使用英文 kebab-case（例如 `skill-browse`、`skill-detail`）。
> 中文业务名用于 `*-prd-*.md`、`*-plan-*.md`、`*-todo-*.md`、`*-review-*.md`、`*-test-*.md`、`*-verify-*.md` 等文档文件名前缀。
> 命名规则详见 `shared/references/ai-programming-docs-standard.md`。

## 后续动作
