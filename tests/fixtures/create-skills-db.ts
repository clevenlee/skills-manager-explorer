/**
 * 自动化测试数据库工厂，在临时路径创建与 Skills Manager 兼容的最小数据集。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:20:00
 */
import { Database } from "bun:sqlite";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

export function createSkillsDatabase(databasePath: string, seed = true): void {
  const database = new Database(databasePath, { create: true, strict: true });
  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE skills (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, source_type TEXT,
      source_ref TEXT, source_ref_resolved TEXT, source_subpath TEXT, source_branch TEXT,
      source_revision TEXT, remote_revision TEXT, central_path TEXT, content_hash TEXT,
      enabled INTEGER NOT NULL DEFAULT 1, created_at INTEGER, updated_at INTEGER,
      status TEXT, update_status TEXT, last_checked_at INTEGER, last_check_error TEXT
    );
    CREATE TABLE scenarios (
      id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, icon TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0, created_at INTEGER, updated_at INTEGER
    );
    CREATE TABLE scenario_skills (
      scenario_id TEXT NOT NULL REFERENCES scenarios(id),
      skill_id TEXT NOT NULL REFERENCES skills(id), added_at INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (scenario_id, skill_id)
    );
  `);

  if (seed) {
    const now = 1_752_710_400_000;
    const insertSkill = database.query(`
      INSERT INTO skills (
        id, name, description, source_type, source_ref, source_ref_resolved, source_subpath,
        source_branch, source_revision, remote_revision, central_path, content_hash, enabled,
        created_at, updated_at, status, update_status, last_checked_at, last_check_error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const skills = [
      [
        "skill-api",
        "API 设计",
        "设计稳定的 API 与接口。",
        "git",
        "https://github.com/acme/skills.git",
        "https://github.com/acme/skills.git",
        "api",
      ],
      [
        "skill-test",
        "测试驱动开发",
        "通过测试推进可靠实现。",
        "git",
        "https://github.com/acme/skills.git",
        "https://github.com/acme/skills.git?ref=main",
        "tdd",
      ],
      [
        "skill-ui",
        "前端界面工程",
        "构建可访问的 Vue 页面。",
        "git",
        "https://gitlab.example.com/team/ui-skills.git",
        "https://gitlab.example.com/team/ui-skills.git",
        "ui",
      ],
      [
        "skill-sec",
        "安全加固",
        "收紧输入与数据边界。",
        "local",
        "/opt/team/security",
        "/opt/team/security",
        null,
      ],
      [
        "skill-doc",
        "文档与 ADR",
        "记录关键工程决策。",
        "git",
        "ssh://git@example.com/docs.git",
        "ssh://git@example.com/docs.git",
        "docs",
      ],
      ["skill-orphan", "独立技能", null, null, null, null, null],
    ] as const;
    for (const [
      id,
      name,
      description,
      sourceType,
      sourceRef,
      sourceResolved,
      subpath,
    ] of skills) {
      insertSkill.run(
        id,
        name,
        description,
        sourceType,
        sourceRef,
        sourceResolved,
        subpath,
        "main",
        "abc123",
        "def456",
        `/skills/${id}`,
        `hash-${id}`,
        1,
        now,
        now,
        "ready",
        "current",
        now,
        null,
      );
    }

    database.exec(`
      INSERT INTO scenarios VALUES ('scenario-dev', '编码开发', '日常编码工作流', 'code', 10, ${now}, ${now});
      INSERT INTO scenarios VALUES ('scenario-review', '代码审查', '提交前质量检查', 'review', 20, ${now}, ${now});
      INSERT INTO scenarios VALUES ('scenario-plan', '方案规划', '需求与技术方案', 'plan', 30, ${now}, ${now});
      INSERT INTO scenarios VALUES ('scenario-empty', '空场景', '尚未分配技能', 'inbox', 40, ${now}, ${now});
      INSERT INTO scenario_skills VALUES ('scenario-dev', 'skill-api', ${now}, 10);
      INSERT INTO scenario_skills VALUES ('scenario-dev', 'skill-test', ${now}, 20);
      INSERT INTO scenario_skills VALUES ('scenario-dev', 'skill-ui', ${now}, 30);
      INSERT INTO scenario_skills VALUES ('scenario-review', 'skill-test', ${now}, 10);
      INSERT INTO scenario_skills VALUES ('scenario-review', 'skill-sec', ${now}, 20);
      INSERT INTO scenario_skills VALUES ('scenario-plan', 'skill-api', ${now}, 10);
      INSERT INTO scenario_skills VALUES ('scenario-plan', 'skill-doc', ${now}, 20);
    `);
  }
  database.close();
}

if (import.meta.main) {
  const output = resolve(
    process.argv[2] || "tests/fixtures/skills-manager.e2e.db",
  );
  if (existsSync(output)) rmSync(output);
  createSkillsDatabase(output);
  console.info(`已准备 E2E 数据库：${output}`);
}
