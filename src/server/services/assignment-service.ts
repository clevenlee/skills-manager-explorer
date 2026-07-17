/**
 * 场景归属写服务，在即时事务中校验 expected 集合并只修改 scenario_skills。
 * 作者：NDP Coding
 * 日期：2026-07-17 11:50:00
 */
import type { AssignmentInput } from "@/shared/contracts/assignment";
import { openWriteDatabase } from "../database/open-database";
import { DomainError } from "./domain-error";

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}
function equalSets(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
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
