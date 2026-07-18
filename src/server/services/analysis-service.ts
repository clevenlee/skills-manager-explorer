/**
 * 分析服务：1.0.6 起提供 1 类"找出 Skill / 场景 / 工作区错配"分析。
 *
 * 当前实现：
 *   listWorkspaceSkillMismatches(databasePath)
 *     找出所有"已被设置到场景、且这些场景也被应用到了工作区，
 *      但 Skill 本身未被正确对应到该工作区启用"的 Skill 清单。
 *
 * 判定逻辑（基于 Skills Manager 已知数据模型）：
 *   1. Skill S 在 scenario_skills 中至少有一个 scenario。
 *   2. 该 scenario 在 scenario_skill_tools 上有 enabled=1 的某行，
 *      即有 workspace W 把它视为"应用"。
 *   3. S 在 W 的 skill_targets 或 scenario_skills(scenario, S, tool=W) 上**没有** enabled=1。
 *   → 报告 (skill, scenario, workspace) 三元组。
 *
 * 作者：NDP Coding
 * 日期：2026-07-18 09:30:00
 */
import type { Database } from "bun:sqlite";

import type { SkillSummary } from "@/shared/contracts/catalog";
import { openReadDatabase } from "../database/open-database";
import {
  getDisabledWorkspaceTools,
  knownWorkspaceTools,
} from "./workspace-service";

export interface WorkspaceSkillMismatch {
  skill: SkillSummary;
  scenario: { id: string; name: string };
  workspace: string;
}

type SkillRow = {
  id: string;
  name: string;
  description: string | null;
  enabled: number;
  status: string | null;
  update_status: string | null;
  source_id: string | null;
  source_key: string | null;
  source_name: string | null;
  source_type: string | null;
  source_external_url: string | null;
  created_at: number | null;
  updated_at: number | null;
};

// 1.0.6.x：实际工作库不一定有 sources 关联；SkillSummary 的 source 字段允许全 null。
function pickSource(row: SkillRow): SkillSummary["source"] {
  if (!row.source_id) return null;
  return {
    id: row.source_id,
    name: row.source_name ?? "",
    type: row.source_type ?? "",
    externalUrl: row.source_external_url ?? null,
  };
}

type ScenarioRow = { id: string; name: string };
type LinkRow = { skill_id: string; scenario_id: string };
type ToolLinkRow = {
  scenario_id: string;
  skill_id: string;
  tool: string;
  enabled: number;
};

function hasTable(database: Database, table: string): boolean {
  try {
    return (
      database
        .query<{ name: string }, [string]>(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
        )
        .get(table) !== null
    );
  } catch {
    return false;
  }
}

function loadAllSkills(database: Database): SkillRow[] {
  // 1.0.6.x：用户库可能缺 sources 表 + skills.source_id / source_type 等可选列；
  // 用 SELECT * 然后按名字挑选，缺失列容忍 undefined。
  const raw = database
    .query<Record<string, unknown>, []>("SELECT * FROM skills")
    .all();
  function pickString(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "bigint")
      return String(value);
    if (typeof value === "boolean") return value ? "1" : "0";
    if (value instanceof Uint8Array) return new TextDecoder().decode(value);
    return JSON.stringify(value);
  }
  return raw.map((row) => ({
    id: pickString(row.id) ?? "",
    name: pickString(row.name) ?? "",
    description: pickString(row.description),
    enabled: Number(row.enabled ?? 1),
    status: pickString(row.status),
    update_status: pickString(row.update_status),
    source_id: pickString(row.source_id),
    source_key: pickString(row.source_key),
    source_name: pickString(row.source_name),
    source_type: pickString(row.source_type),
    source_external_url: pickString(row.source_external_url),
    created_at: row.created_at == null ? null : Number(row.created_at),
    updated_at: row.updated_at == null ? null : Number(row.updated_at),
  }));
}

function loadScenarioMap(database: Database): Map<string, ScenarioRow> {
  const out = new Map<string, ScenarioRow>();
  if (!hasTable(database, "scenarios")) return out;
  for (const row of database
    .query<ScenarioRow, []>("SELECT id, name FROM scenarios")
    .all())
    out.set(row.id, row);
  return out;
}

function loadSkillScenarios(database: Database): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  if (!hasTable(database, "scenario_skills")) return out;
  for (const row of database
    .query<LinkRow, []>("SELECT skill_id, scenario_id FROM scenario_skills")
    .all()) {
    const set = out.get(row.skill_id) ?? new Set<string>();
    set.add(row.scenario_id);
    out.set(row.skill_id, set);
  }
  return out;
}

function loadSkillTargetsByTool(database: Database): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  if (!hasTable(database, "skill_targets")) return out;
  for (const row of database
    .query<{ skill_id: string; tool: string }, []>(
      "SELECT skill_id, tool FROM skill_targets WHERE tool <> ''",
    )
    .all()) {
    const set = out.get(row.tool) ?? new Set<string>();
    set.add(row.skill_id);
    out.set(row.tool, set);
  }
  return out;
}

function loadToolLinks(database: Database): {
  byTool: Map<string, ToolLinkRow[]>;
  enabledByToolSkill: Map<string, Set<string>>;
} {
  const byTool = new Map<string, ToolLinkRow[]>();
  const enabledByToolSkill = new Map<string, Set<string>>();
  if (!hasTable(database, "scenario_skill_tools")) {
    return { byTool, enabledByToolSkill };
  }
  for (const row of database
    .query<ToolLinkRow, []>(
      `SELECT scenario_id, skill_id, tool, enabled
         FROM scenario_skill_tools
         WHERE tool <> ''`,
    )
    .all()) {
    const list = byTool.get(row.tool) ?? [];
    list.push(row);
    byTool.set(row.tool, list);
    if (row.enabled === 1) {
      const set = enabledByToolSkill.get(row.tool) ?? new Set<string>();
      set.add(row.skill_id);
      enabledByToolSkill.set(row.tool, set);
    }
  }
  return { byTool, enabledByToolSkill };
}

function toSkillSummary(row: SkillRow): SkillSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    enabled: row.enabled === 1,
    status: row.status,
    updateStatus: row.update_status,
    source: pickSource(row),
    scenarios: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listWorkspaceSkillMismatches(
  databasePath: string,
): WorkspaceSkillMismatch[] {
  const database = openReadDatabase(databasePath);
  try {
    // 1.0.6.x：仅分析已启用工作区（settings.disabled_tools 中显式禁用的工具跳过）。
    const allTools = knownWorkspaceTools(database);
    const disabled = getDisabledWorkspaceTools(database);
    const tools = allTools.filter((t) => !disabled.has(t));
    if (tools.length === 0) return [];
    const skillById = new Map<string, SkillRow>(
      loadAllSkills(database).map((s) => [s.id, s]),
    );
    const scenarioById = loadScenarioMap(database);
    const skillScenarios = loadSkillScenarios(database);
    const skillTargetsByTool = loadSkillTargetsByTool(database);
    const { byTool, enabledByToolSkill } = loadToolLinks(database);
    const result: WorkspaceSkillMismatch[] = [];
    for (const tool of tools) {
      const enabledSkillsForTool = new Set<string>([
        ...(enabledByToolSkill.get(tool) ?? []),
        ...(skillTargetsByTool.get(tool) ?? []),
      ]);
      const toolLinks = byTool.get(tool) ?? [];
      for (const link of toolLinks) {
        if (link.enabled !== 1) continue;
        const scenarioId = link.scenario_id;
        if (!scenarioById.has(scenarioId)) continue;
        const scenarioName = scenarioById.get(scenarioId)?.name ?? scenarioId;
        for (const [skillId, scenarios] of skillScenarios.entries()) {
          if (!scenarios.has(scenarioId)) continue;
          if (enabledSkillsForTool.has(skillId)) continue;
          const row = skillById.get(skillId);
          if (!row) continue;
          result.push({
            skill: toSkillSummary(row),
            scenario: { id: scenarioId, name: scenarioName },
            workspace: tool,
          });
        }
      }
    }
    return result;
  } finally {
    database.close();
  }
}
