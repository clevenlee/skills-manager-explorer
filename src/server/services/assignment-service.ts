/**
 * 场景归属写服务，在即时事务中校验并修改 scenario_skills；批量新增同时同步 GUI 重建元数据。
 * 1.0.3 起新增 bulkAddSkillScenarios：把若干场景**加**入若干 Skill，不替换。
 * 作者：NDP Coding
 * 日期：2026-07-17 11:50:00
 */
import type {
  AssignmentInput,
  BulkAddSkillScenariosInput,
} from "@/shared/contracts/assignment";
import type { Database } from "bun:sqlite";
import { openWriteDatabase } from "../database/open-database";
import { DomainError } from "./domain-error";
import {
  MetadataWriteError,
  persistAddedMembershipMetadata,
  removeCreatedMembershipMetadata,
  type ScenarioMembershipMetadata,
} from "./scenario-membership-metadata";

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}
function equalSets(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function hasTable(database: Database, table: string): boolean {
  return Boolean(
    database
      .query<{ found: number }, [string]>(
        "SELECT 1 AS found FROM sqlite_master WHERE type = 'table' AND name = ?",
      )
      .get(table),
  );
}

function stringsFromJson(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed))
      return parsed.filter((item): item is string => typeof item === "string");
    if (parsed && typeof parsed === "object") return Object.keys(parsed);
  } catch {
    // 无效设置不应阻断场景归属；其他数据库记录仍可确定工作区工具。
  }
  return [];
}

/**
 * 找出当前 Skills Manager 已知的工作区工具。
 * 新增场景归属必须为这些工具写入显式 false，否则 GUI 会把“缺失开关”补成 true，
 * 并在当前场景启动同步时把 Skill 部署到工作区。
 */
function knownWorkspaceTools(database: Database): string[] {
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
            const key = (item as Record<string, unknown>).key;
            if (typeof key === "string") tools.add(key);
          }
      } catch {
        // 与上面的设置解析一样，忽略损坏的非关键配置。
      }
  }
  return [...tools].sort();
}

export function replaceSkillScenarios(
  databasePath: string,
  skillId: string,
  input: AssignmentInput,
) {
  let database;
  try {
    database = openWriteDatabase(databasePath);
  } catch {
    throw new DomainError("DATABASE_READ_ONLY", "数据库当前不可写。", 503);
  }
  try {
    const execute = database.transaction(() => {
      const skill = database
        .query<{ id: string }, [string]>("SELECT id FROM skills WHERE id = ?")
        .get(skillId);
      if (!skill)
        throw new DomainError("SKILL_NOT_FOUND", "未找到指定 Skill。", 404);
      const current = sortedUnique(
        database
          .query<{ scenario_id: string }, [string]>(
            "SELECT scenario_id FROM scenario_skills WHERE skill_id = ?",
          )
          .all(skillId)
          .map((row) => row.scenario_id),
      );
      const expected = sortedUnique(input.expectedScenarioIds);
      if (!equalSets(current, expected))
        throw new DomainError(
          "ASSIGNMENT_CONFLICT",
          "场景归属已发生变化，请刷新后重试。",
          409,
          { currentScenarioIds: current },
        );
      const target = sortedUnique(input.scenarioIds);
      if (target.length > 0) {
        const placeholders = target.map(() => "?").join(",");
        const existing = database
          .query<{ id: string }, string[]>(
            `SELECT id FROM scenarios WHERE id IN (${placeholders})`,
          )
          .all(...target)
          .map((row) => row.id);
        if (existing.length !== target.length)
          throw new DomainError(
            "SCENARIO_NOT_FOUND",
            "一个或多个场景不存在。",
            404,
          );
      }
      const addedScenarioIds = target.filter((id) => !current.includes(id));
      const removedScenarioIds = current.filter((id) => !target.includes(id));
      const remove = database.query(
        "DELETE FROM scenario_skills WHERE skill_id = ? AND scenario_id = ?",
      );
      const add = database.query(
        "INSERT INTO scenario_skills (scenario_id, skill_id, added_at, sort_order) VALUES (?, ?, ?, 0)",
      );
      for (const scenarioId of removedScenarioIds)
        remove.run(skillId, scenarioId);
      for (const scenarioId of addedScenarioIds)
        add.run(scenarioId, skillId, Date.now());
      const scenarios = database
        .query<{ id: string; name: string; sort_order: number }, [string]>(
          `SELECT s.id, s.name, s.sort_order FROM scenarios s JOIN scenario_skills ss ON ss.scenario_id = s.id WHERE ss.skill_id = ? ORDER BY s.sort_order, s.name`,
        )
        .all(skillId)
        .map((row) => ({
          id: row.id,
          name: row.name,
          sortOrder: row.sort_order,
        }));
      return { scenarios, addedScenarioIds, removedScenarioIds };
    });
    return execute.immediate();
  } catch (error) {
    if (error instanceof DomainError) throw error;
    const message =
      error instanceof Error ? error.message.toLocaleLowerCase() : "";
    if (message.includes("locked") || message.includes("busy"))
      throw new DomainError(
        "DATABASE_LOCKED",
        "数据库正在被其他程序使用，请稍后重试。",
        409,
      );
    throw new DomainError("DATABASE_READ_ONLY", "数据库当前不可写。", 503);
  } finally {
    database.close();
  }
}

/**
 * 批量把若干场景**加**入若干 Skill，不替换已有归属。
 * 全局校验：所有 skillId 与 scenarioId 必须存在（任一缺失 → 404），且数据库可写（不可写 → 503）。
 * 写入：一个即时事务完成全部关联和 GUI 重建元数据；任一环节失败时整体回滚。
 */
export function bulkAddSkillScenarios(
  databasePath: string,
  input: BulkAddSkillScenariosInput,
) {
  const skillIds = sortedUnique(input.skillIds);
  const scenarioIds = sortedUnique(input.scenarioIds);
  let database;
  try {
    database = openWriteDatabase(databasePath);
  } catch {
    throw new DomainError("DATABASE_READ_ONLY", "数据库当前不可写。", 503);
  }
  try {
    const createdMetadataPaths: string[] = [];
    const execute = database.transaction(() => {
      const workspaceTools = knownWorkspaceTools(database);
      const workspacePolicy = Object.fromEntries(
        workspaceTools.map((tool) => [tool, false] as const),
      );
      const disableWorkspace =
        hasTable(database, "scenario_skill_tools") && workspaceTools.length > 0
          ? database.query(
              "INSERT OR REPLACE INTO scenario_skill_tools (scenario_id, skill_id, tool, enabled, updated_at) VALUES (?, ?, ?, 0, ?)",
            )
          : null;
      const skillRows = database
        .query<{ id: string; name: string }, string[]>(
          `SELECT id, name FROM skills WHERE id IN (${skillIds.map(() => "?").join(",")})`,
        )
        .all(...skillIds);
      if (skillRows.length !== skillIds.length)
        throw new DomainError(
          "SKILL_NOT_FOUND",
          "一个或多个 Skill 不存在。",
          404,
        );
      const scenarioRows = database
        .query<{ id: string; name: string; sort_order: number }, string[]>(
          `SELECT id, name, sort_order FROM scenarios WHERE id IN (${scenarioIds.map(() => "?").join(",")})`,
        )
        .all(...scenarioIds);
      if (scenarioRows.length !== scenarioIds.length)
        throw new DomainError(
          "SCENARIO_NOT_FOUND",
          "一个或多个场景不存在。",
          404,
        );

      const nameById = new Map(skillRows.map((row) => [row.id, row.name]));
      const scenarioById = new Map(
        scenarioRows.map((row) => [
          row.id,
          { name: row.name, sortOrder: row.sort_order },
        ]),
      );
      const existingRows = database
        .query<{ skill_id: string; scenario_id: string }, string[]>(
          `SELECT skill_id, scenario_id FROM scenario_skills WHERE skill_id IN (${skillIds.map(() => "?").join(",")})`,
        )
        .all(...skillIds);
      const currentBySkill = new Map<string, Set<string>>();
      for (const row of existingRows) {
        const set = currentBySkill.get(row.skill_id) ?? new Set<string>();
        set.add(row.scenario_id);
        currentBySkill.set(row.skill_id, set);
      }
      const maxSortRows = database
        .query<{ scenario_id: string; max_sort_order: number }, string[]>(
          `SELECT scenario_id, COALESCE(MAX(sort_order), -1) AS max_sort_order FROM scenario_skills WHERE scenario_id IN (${scenarioIds.map(() => "?").join(",")}) GROUP BY scenario_id`,
        )
        .all(...scenarioIds);
      const nextSortOrder = new Map(
        scenarioIds.map((id) => [
          id,
          (maxSortRows.find((row) => row.scenario_id === id)?.max_sort_order ??
            -1) + 1,
        ]),
      );
      const add = database.query(
        "INSERT INTO scenario_skills (scenario_id, skill_id, added_at, sort_order) VALUES (?, ?, ?, ?)",
      );
      const metadata: ScenarioMembershipMetadata[] = [];
      const results: {
        skillId: string;
        name: string;
        addedScenarioIds: string[];
        scenarios: { id: string; name: string; sortOrder: number }[];
      }[] = [];
      const skipped: { skillId: string; name: string }[] = [];

      for (const skillId of skillIds) {
        const current = currentBySkill.get(skillId) ?? new Set<string>();
        const toAdd = scenarioIds.filter((id) => !current.has(id));
        if (toAdd.length === 0) {
          skipped.push({ skillId, name: nameById.get(skillId) ?? skillId });
          continue;
        }
        for (const scenarioId of toAdd) {
          const sortOrder = nextSortOrder.get(scenarioId) ?? 0;
          nextSortOrder.set(scenarioId, sortOrder + 1);
          const now = Date.now();
          add.run(scenarioId, skillId, now, sortOrder);
          for (const tool of workspaceTools)
            disableWorkspace?.run(scenarioId, skillId, tool, now);
          metadata.push({
            scenarioId,
            skillId,
            sortOrder,
            tools: workspacePolicy,
          });
        }
        const all = new Set([...current, ...toAdd]);
        results.push({
          skillId,
          name: nameById.get(skillId) ?? skillId,
          addedScenarioIds: toAdd,
          scenarios: [...all]
            .map((id) => ({
              id,
              name: scenarioById.get(id)?.name ?? id,
              sortOrder: scenarioById.get(id)?.sortOrder ?? 0,
            }))
            .sort((a, b) => a.name.localeCompare(b.name, "zh-CN")),
        });
      }
      persistAddedMembershipMetadata(
        databasePath,
        metadata,
        createdMetadataPaths,
      );
      return { results, skipped };
    });
    try {
      return execute.immediate();
    } catch (error) {
      removeCreatedMembershipMetadata(createdMetadataPaths);
      throw error;
    }
  } catch (error) {
    if (error instanceof DomainError) throw error;
    if (error instanceof MetadataWriteError)
      throw new DomainError(
        "METADATA_WRITE_FAILED",
        "场景归属未保存：Skills Manager 元数据无法写入。",
        503,
      );
    const message =
      error instanceof Error ? error.message.toLocaleLowerCase() : "";
    if (message.includes("locked") || message.includes("busy"))
      throw new DomainError(
        "DATABASE_LOCKED",
        "数据库正在被其他程序使用，请稍后重试。",
        409,
      );
    throw new DomainError("DATABASE_READ_ONLY", "数据库当前不可写。", 503);
  } finally {
    database.close();
  }
}
