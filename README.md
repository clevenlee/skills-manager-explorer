# 技能管家浏览器（skills-manager-browser）

NDP 应用端前端项目，当前处于仓库初始化阶段。

- 端别：应用端前端（apps-frontend）
- 文档地图与智能体入口：[AGENTS.md](./AGENTS.md)
- 项目事实与模块清单：[docs/project-specs/](./docs/project-specs/)

## 仓库布局

```
.
├── AGENTS.md                    # 仓库级地图，AI 与人类共同入口
├── README.md                    # 本文件
├── .env.development.agent       # 本地开发环境变量模板
└── docs/
    └── project-specs/           # 全局项目事实、模块清单
        ├── overview.md
        └── module-inventory.md
```

## 状态

仓库仅完成目录规范与入口文件；业务模块、`package.json`、构建脚本、Mock 契约、测试均待 PRD/计划落地后按 `docs/modules/<module>/` 体系创建。
