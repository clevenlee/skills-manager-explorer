/**
 * 工作区服务：列出 Skills Manager 已知工作区（= workspace tools），
 * 以及在指定工作区**已启用**的 Skill / 所属场景集合。
 *
 * 数据源（按优先级合并去重）：
 *   1. `scenario_skill_tools` (skill_id, scenario_id, tool, enabled=1) → 关联级开关
 *   2. `skill_targets` (skill_id, tool) → 全局工具镜像
 *   3. `settings.disabled_tools` (settings.key = 'disabled_tools') → 显式禁用的工具
 *   4. `settings.custom_tools` (settings.key = 'custom_tools') → 用户自定义工具
 *
 * 1.0.4 引入：左栏菜单"工作区"、Skills 列表工作区筛选、集合比对的工作区操作数。
 * 作者：NDP Coding
 * 日期：2026-07-18 09:30:00
 */
import type { Database } from "bun:sqlite";

import type { Workspace } from "@/shared/contracts/catalog";
import { openReadDatabase } from "../database/open-database";

/** 轻量表存在性检测；表不存在时优雅降级（不抛错）。 */
function hasTable(database: Database, table: string): boolean {
  try {
    const row = database
      .query<{ name: string }, [string]>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
      )
      .get(table);
    return row !== null;
  } catch {
    return false;
  }
}

function stringsFromJson(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((s): s is string => typeof s === "string");
    }
  } catch {
    // ignore
  }
  return [];
}

function disabledWorkspaceTools(database: Database): Set<string> {
  if (!hasTable(database, "settings")) return new Set<string>();
  const value = database
    .query<{ value: string }, []>(
      "SELECT value FROM settings WHERE key = 'disabled_tools'",
    )
    .get()?.value;
  return new Set(stringsFromJson(value));
}

/** 对外暴露：1.0.6.x 分析用，先取禁用集再过滤。 */
export function getDisabledWorkspaceTools(database: Database): Set<string> {
  return disabledWorkspaceTools(database);
}

/**
 * 找出当前 Skills Manager 已知的工作区工具名集合。
 * 复用 assignment-service 中的同款逻辑，但单测可独立调用。
 */
export function knownWorkspaceTools(database: Database): string[] {
  const tools = new Set<string>();
  if (hasTable(database, "scenario_skill_tools"))
    for (const row of database
      .query<{ tool: string }, []>(
        "SELECT DISTINCT tool FROM scenario_skill_tools WHERE tool <> ''",
      )
      .all())
      tools.add(row.tool);
  if (hasTable(database, "skill_targets"))
    for (const row of database
      .query<{ tool: string }, []>(
        "SELECT DISTINCT tool FROM skill_targets WHERE tool <> ''",
      )
      .all())
      tools.add(row.tool);
  if (hasTable(database, "settings")) {
    const setting = database.query<{ value: string }, [string]>(
      "SELECT value FROM settings WHERE key = ?",
    );
    for (const key of [
      "disabled_tools",
      "tool_order",
      "custom_tool_paths",
      "custom_tool_project_paths",
    ])
      for (const tool of stringsFromJson(setting.get(key)?.value))
        tools.add(tool);

    const customTools = setting.get("custom_tools")?.value;
    if (customTools)
      try {
        const parsed = JSON.parse(customTools) as unknown;
        if (Array.isArray(parsed))
          for (const item of parsed) {
            if (!item || typeof item !== "object") continue;
            const k = (item as Record<string, unknown>).key;
            if (typeof k === "string") tools.add(k);
          }
      } catch {
        // ignore
      }
  }
  return [...tools].sort();
}

/**
 * 工作区**已启用**的 Skill 集合（去重后）。
 *   - 关联表 `scenario_skill_tools` 上 enabled=1 时视为启用
 *   - `skill_targets` 中出现也视为启用（用户主动声明的目标）
 *   - `settings.disabled_tools` 中显式禁用的工具**不**算"已启用"
 */
export function enabledSkillIdsInTool(
  database: Database,
  tool: string,
  disabledTools = disabledWorkspaceTools(database),
): { skillIds: Set<string>; scenarioIds: Set<string> } {
  const skillIds = new Set<string>();
  const scenarioIds = new Set<string>();
  if (disabledTools.has(tool)) return { skillIds, scenarioIds };
  if (hasTable(database, "scenario_skill_tools")) {
    for (const row of database
      .query<{ skill_id: string; scenario_id: string }, [string]>(
        "SELECT skill_id, scenario_id FROM scenario_skill_tools WHERE tool = ? AND enabled = 1",
      )
      .all(tool)) {
      skillIds.add(row.skill_id);
      scenarioIds.add(row.scenario_id);
    }
  }
  if (hasTable(database, "skill_targets")) {
    for (const row of database
      .query<{ skill_id: string }, [string]>(
        "SELECT skill_id FROM skill_targets WHERE tool = ?",
      )
      .all(tool))
      skillIds.add(row.skill_id);
  }
  return { skillIds, scenarioIds };
}

export interface WorkspaceListing {
  name: string;
  enabled: boolean;
  enabledSkillCount: number;
  enabledScenarioCount: number;
}

/** 列出所有已知工作区及其已启用 Skill / 场景数量。 */
export function listWorkspaces(databasePath: string): WorkspaceListing[] {
  const database = openReadDatabase(databasePath);
  try {
    const disabledTools = disabledWorkspaceTools(database);
    return knownWorkspaceTools(database).map((name) => {
      const enabled = !disabledTools.has(name);
      const { skillIds, scenarioIds } = enabledSkillIdsInTool(
        database,
        name,
        disabledTools,
      );
      return {
        name,
        enabled,
        enabledSkillCount: skillIds.size,
        enabledScenarioCount: scenarioIds.size,
      };
    });
  } finally {
    database.close();
  }
}

export function listWorkspacesEnvelope(databasePath: string): Workspace[] {
  return listWorkspaces(databasePath);
}

export { knownWorkspaceTools as _knownWorkspaceTools };
