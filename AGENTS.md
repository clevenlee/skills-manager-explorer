# 技能管家浏览器 - 智能体入口

> 仓库级地图。AI 编程前必读；本文件不承载实现细节，项目专属事实请写入 `docs/project-specs/` 或对应模块文档。

## 1. 项目定位

- 中文名：技能管家浏览器
- 英文名（目录名）：`skills-manager-browser`

## 3. 必读规则

## 4. 文档目录与 owner

| 目录                       | 职责                                                    | owner |
|--------------------------|-------------------------------------------------------| --- |
| `AGENTS.md`              | 仓库级地图，AI 与人类共同入口                                      | 仓库 |
| `README.md`              | 人类读者的一句话定位                                            | 仓库 |
| `.env.development.agent` | 本地开发环境变量模板（端口、Mock、后端 host 等）                         | 仓库 |
| `docs/project-specs/`    | 全局项目事实、技术栈、模块清单、验证入口                                  | 仓库 |
| `docs/modules/<module>/` | 业务模块文档（按需创建：exec-plans、openapi、review、test、handoff 等） | 模块 |
| `docs/scripts/`          | 跨模块复用的全局脚本（按需创建）                                      | 仓库 |

> 业务模块目录在 PRD/执行计划落地后按 `docs/modules/<kebab-case>/` 创建；未实际承载内容前不预建空目录。

## 5. 启动入口

## 6. 验证入口
- 提交前自查：AGENTS/文档 owner、必读规则是否一致；未跑项和剩余风险写入交付说明。

## 7. 改动前必须确认

- 是否需要同步 `docs/project-specs/overview.md`、`docs/project-specs/module-inventory.md` 或对应模块文档。

