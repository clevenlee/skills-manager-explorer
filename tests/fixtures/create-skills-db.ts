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
    CREATE TABLE scenario_skill_tools (
      scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
      skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      tool TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (scenario_id, skill_id, tool)
    );
    CREATE TABLE active_scenario (
      key TEXT PRIMARY KEY DEFAULT 'current',
      scenario_id TEXT REFERENCES scenarios(id) ON DELETE SET NULL
    );
    CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE skill_targets (
      id TEXT PRIMARY KEY,
      skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      tool TEXT NOT NULL, target_path TEXT NOT NULL, mode TEXT NOT NULL,
      status TEXT DEFAULT 'ok', synced_at INTEGER, last_error TEXT,
      source_hash TEXT, UNIQUE(skill_id, tool)
    );
    CREATE TABLE projects (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, path TEXT NOT NULL UNIQUE,
      workspace_type TEXT NOT NULL DEFAULT 'project', linked_agent_key TEXT,
      linked_agent_name TEXT, disabled_path TEXT, sort_order INTEGER DEFAULT 0,
      created_at INTEGER, updated_at INTEGER
    );
    CREATE TABLE audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL,
      action TEXT NOT NULL, skill_id TEXT, skill_name TEXT, tool TEXT,
      success INTEGER NOT NULL, detail TEXT
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
      INSERT INTO scenario_skill_tools VALUES ('scenario-review', 'skill-test', 'claude_code', 1, ${now});
      INSERT INTO scenario_skill_tools VALUES ('scenario-review', 'skill-test', 'codex', 1, ${now});
      INSERT INTO active_scenario VALUES ('current', 'scenario-review');
      INSERT INTO settings VALUES ('disabled_tools', '["cursor"]');
      INSERT INTO settings VALUES ('custom_tools', '[{"key":"team_agent","display_name":"Team Agent","skills_dir":"/tmp/team-agent"}]');
      INSERT INTO skill_targets VALUES ('target-test', 'skill-test', 'codex', '/tmp/codex/skill-test', 'symlink', 'ok', ${now}, NULL, 'hash-skill-test');
      INSERT INTO projects VALUES ('project-one', '示例项目', '/tmp/project-one', 'project', NULL, NULL, NULL, 0, ${now}, ${now});
      INSERT INTO audit_log (ts, action, skill_id, skill_name, tool, success) VALUES (${Math.floor(now / 1000)}, 'enable', 'skill-test', '测试驱动开发', 'codex', 1);
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
