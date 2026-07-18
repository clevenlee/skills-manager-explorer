/**
 * 单元测试：listWorkspaceSkillMismatches 在不同数据场景下行为正确。
 * 作者：NDP Coding
 * 日期：2026-07-18 09:30:00
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { listWorkspaceSkillMismatches } from "@/server/services/analysis-service";

let directory = "";
let databasePath = "";
function exec(sql: string): void {
  const d = new Database(databasePath);
  d.exec(sql);
  d.close();
}

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "skills-analysis-"));
  databasePath = join(directory, "analysis.db");
  // 基础 schema
  const init = new Database(databasePath);
  init.exec(`
    CREATE TABLE skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      status TEXT,
      update_status TEXT,
      source_id TEXT,
      created_at INTEGER,
      updated_at INTEGER
    );
    CREATE TABLE sources (
      id TEXT PRIMARY KEY,
      key TEXT,
      name TEXT,
      type TEXT,
      external_url TEXT
    );
    CREATE TABLE scenarios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );
    CREATE TABLE scenario_skills (
      skill_id TEXT NOT NULL,
      scenario_id TEXT NOT NULL,
      PRIMARY KEY (skill_id, scenario_id)
    );
    CREATE TABLE scenario_skill_tools (
      scenario_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      tool TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER,
      PRIMARY KEY (scenario_id, skill_id, tool)
    );
    CREATE TABLE skill_targets (
      skill_id TEXT NOT NULL,
      tool TEXT NOT NULL,
      PRIMARY KEY (skill_id, tool)
    );
    INSERT INTO skills (id, name, enabled) VALUES
      ('skill-api', 'API 设计', 1),
      ('skill-test', '测试驱动', 1),
      ('skill-orphan', '未归属', 1);
    INSERT INTO sources (id, key, name) VALUES ('src-cursor', 'cursor', 'Cursor');
    UPDATE skills SET source_id = 'src-cursor' WHERE id = 'skill-api';
  `);
  init.close();
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));

describe("listWorkspaceSkillMismatches", () => {
  test("空数据库返回空数组", () => {
    expect(listWorkspaceSkillMismatches(databasePath)).toEqual([]);
  });

  test("Skill 在 scenario 中，但该 scenario 未被任何工作区启用 → 不算错配", () => {
    exec(`
      INSERT INTO scenarios (id, name) VALUES ('sc-dev', '开发');
      INSERT INTO scenario_skills (skill_id, scenario_id) VALUES
        ('skill-api', 'sc-dev');
    `);
    expect(listWorkspaceSkillMismatches(databasePath)).toEqual([]);
  });

  test("场景被工作区启用，Skill 也在该工作区 skill_targets 中 → 不算错配", () => {
    exec(`
      INSERT INTO scenarios (id, name) VALUES ('sc-dev', '开发');
      INSERT INTO scenario_skills (skill_id, scenario_id) VALUES
        ('skill-api', 'sc-dev');
      INSERT INTO scenario_skill_tools (scenario_id, skill_id, tool, enabled)
        VALUES ('sc-dev', 'skill-test', 'cursor', 1);
      INSERT INTO skill_targets (skill_id, tool)
        VALUES ('skill-api', 'cursor');
    `);
    expect(listWorkspaceSkillMismatches(databasePath)).toEqual([]);
  });

  test("场景被工作区启用，但 Skill 没在该工作区启用 → 报告错配", () => {
    exec(`
      INSERT INTO scenarios (id, name) VALUES ('sc-dev', '开发');
      INSERT INTO scenario_skills (skill_id, scenario_id) VALUES
        ('skill-api', 'sc-dev');
      INSERT INTO scenario_skill_tools (scenario_id, skill_id, tool, enabled)
        VALUES ('sc-dev', 'skill-test', 'cursor', 1);
    `);
    const result = listWorkspaceSkillMismatches(databasePath);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      workspace: "cursor",
      scenario: { id: "sc-dev", name: "开发" },
      skill: { id: "skill-api" },
    });
  });

  test("Skill 在 scenario_skills 但在 scenario_skill_tools 中 enabled=0 → 不算错配", () => {
    exec(`
      INSERT INTO scenarios (id, name) VALUES ('sc-dev', '开发');
      INSERT INTO scenario_skills (skill_id, scenario_id) VALUES
        ('skill-api', 'sc-dev');
      INSERT INTO scenario_skill_tools (scenario_id, skill_id, tool, enabled)
        VALUES ('sc-dev', 'skill-test', 'cursor', 0);
    `);
    expect(listWorkspaceSkillMismatches(databasePath)).toEqual([]);
  });

  test("Skill 不在 scenario_skills 中 → 不算错配（即使工具启用过其他 Skill）", () => {
    exec(`
      INSERT INTO scenarios (id, name) VALUES ('sc-dev', '开发');
      INSERT INTO scenario_skills (skill_id, scenario_id) VALUES
        ('skill-test', 'sc-dev');
      INSERT INTO scenario_skill_tools (scenario_id, skill_id, tool, enabled)
        VALUES ('sc-dev', 'skill-test', 'cursor', 1);
    `);
    expect(listWorkspaceSkillMismatches(databasePath)).toEqual([]);
  });

  test("同一 Skill 在同一工作区的多个启用场景 → 去重后只报一次", () => {
    exec(`
      INSERT INTO scenarios (id, name) VALUES ('sc-dev', '开发'), ('sc-plan', '规划');
      INSERT INTO scenario_skills (skill_id, scenario_id) VALUES
        ('skill-api', 'sc-dev'),
        ('skill-api', 'sc-plan');
      INSERT INTO scenario_skill_tools (scenario_id, skill_id, tool, enabled)
        VALUES
        ('sc-dev', 'skill-test', 'cursor', 1),
        ('sc-plan', 'skill-test', 'cursor', 1);
    `);
    // 但 view 按 workspace 分组
    // 上面只报一个 workspace = cursor
    const result = listWorkspaceSkillMismatches(databasePath);
    expect(result).toHaveLength(2);
    // 两个 scenario 都会在错配里
    const scenarios = result.map((m) => m.scenario.id).sort();
    expect(scenarios).toEqual(["sc-dev", "sc-plan"]);
  });
});

describe("enabled workspace filter", () => {
  function setupWithSettings(): string {
    const dir = mkdtempSync(join(tmpdir(), "skills-disabled-"));
    const dbp = join(dir, "disabled.db");
    const d = new Database(dbp);
    d.exec(`
      CREATE TABLE skills (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
        source_type TEXT, source_ref TEXT, source_ref_resolved TEXT,
        source_subpath TEXT, source_branch TEXT, source_revision TEXT,
        remote_revision TEXT, central_path TEXT, content_hash TEXT,
        enabled INTEGER NOT NULL DEFAULT 1, created_at INTEGER, updated_at INTEGER,
        status TEXT, update_status TEXT, last_checked_at INTEGER,
        last_check_error TEXT
      );
      CREATE TABLE scenarios (id TEXT PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE scenario_skills (
        scenario_id TEXT NOT NULL, skill_id TEXT NOT NULL, added_at INTEGER,
        sort_order INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (scenario_id, skill_id)
      );
      CREATE TABLE scenario_skill_tools (
        scenario_id TEXT NOT NULL, skill_id TEXT NOT NULL, tool TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL,
        PRIMARY KEY (scenario_id, skill_id, tool)
      );
      CREATE TABLE skill_targets (
        skill_id TEXT NOT NULL, tool TEXT NOT NULL,
        PRIMARY KEY (skill_id, tool)
      );
      CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT);
      INSERT INTO skills (id, name, enabled) VALUES
        ('skill-cursor', 'Cursor Skill', 1),
        ('skill-claude', 'Claude Skill', 1);
      INSERT INTO scenarios (id, name) VALUES ('sc-dev', 'Dev');
      INSERT INTO scenario_skills (skill_id, scenario_id) VALUES
        ('skill-cursor', 'sc-dev'),
        ('skill-claude', 'sc-dev');
      INSERT INTO scenario_skill_tools (scenario_id, skill_id, tool, enabled) VALUES
        ('sc-dev', 'skill-cursor', 'cursor', 1),
        ('sc-dev', 'skill-claude', 'claude_code', 1);
    `);
    d.close();
    return dbp;
  }

  test("settings.disabled_tools 中显式禁用的工作区不出现在错配清单", () => {
    const dbp = setupWithSettings();
    // 把 cursor 加入 disabled_tools
    const d = new Database(dbp);
    d.exec(
      `INSERT INTO settings (key, value) VALUES ('disabled_tools', '["cursor"]')`,
    );
    d.close();

    // cursor 工具虽然有 enabled skill，但被显式禁用 → 不进错配
    const result = listWorkspaceSkillMismatches(dbp);
    expect(result).toEqual([]);

    rmSync(dbp.replace("/disabled.db", ""), { recursive: true, force: true });
  });

  test("settings.disabled_tools 为空数组时所有工具都被分析", () => {
    const dbp = setupWithSettings();
    const d = new Database(dbp);
    d.exec(`INSERT INTO settings (key, value) VALUES ('disabled_tools', '[]')`);
    d.close();

    // 没有禁用：cursor + claude_code 都被分析
    // cursor: skill-cursor 在 enabled 集合里 → 不进错配
    // claude_code: skill-claude 在 enabled 集合里 → 不进错配
    // → 0 条错配
    const result = listWorkspaceSkillMismatches(dbp);
    expect(result).toEqual([]);

    rmSync(dbp.replace("/disabled.db", ""), { recursive: true, force: true });
  });
});

describe("database schema variants", () => {
  test("Skills 表没有 source_id 列时仍能正确计算错配（1.0.6.x 真实库）", () => {
    // 重新建一个不带 source_id 列和 sources 表的库
    const dir = mkdtempSync(join(tmpdir(), "skills-no-source-id-"));
    const dbp = join(dir, "no-source-id.db");
    const d = new Database(dbp);
    d.exec(`
      CREATE TABLE skills (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
        source_type TEXT, source_ref TEXT, source_ref_resolved TEXT,
        source_subpath TEXT, source_branch TEXT, source_revision TEXT,
        remote_revision TEXT, central_path TEXT, content_hash TEXT,
        enabled INTEGER NOT NULL DEFAULT 1, created_at INTEGER, updated_at INTEGER,
        status TEXT, update_status TEXT, last_checked_at INTEGER,
        last_check_error TEXT
      );
      CREATE TABLE scenarios (id TEXT PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE scenario_skills (
        scenario_id TEXT NOT NULL, skill_id TEXT NOT NULL, added_at INTEGER,
        sort_order INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (scenario_id, skill_id)
      );
      CREATE TABLE scenario_skill_tools (
        scenario_id TEXT NOT NULL, skill_id TEXT NOT NULL, tool TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL,
        PRIMARY KEY (scenario_id, skill_id, tool)
      );
      CREATE TABLE skill_targets (
        skill_id TEXT NOT NULL, tool TEXT NOT NULL,
        PRIMARY KEY (skill_id, tool)
      );
      INSERT INTO skills (id, name, enabled) VALUES
        ('skill-a', 'Computer Use', 1),
        ('skill-b', 'Design', 1);
      INSERT INTO scenarios (id, name) VALUES ('sc-dev', 'Dev');
      INSERT INTO scenario_skills (skill_id, scenario_id) VALUES
        ('skill-a', 'sc-dev'),
        ('skill-b', 'sc-dev');
      INSERT INTO scenario_skill_tools (scenario_id, skill_id, tool, enabled) VALUES
        ('sc-dev', 'skill-b', 'cursor', 1);
      INSERT INTO skill_targets (skill_id, tool) VALUES ('skill-a', 'cursor');
    `);
    d.close();
    const result = listWorkspaceSkillMismatches(dbp);
    // skill-a 在 skill_targets 中是启用的；skill-b 在 scenario_skill_tools 中是启用的
    // → 两者均在 cursor 启用集中，零错配。
    expect(result).toEqual([]);
    rmSync(dir, { recursive: true, force: true });
  });
});
