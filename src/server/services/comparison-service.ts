/**
 * 集合比对服务，解析来源、场景或工作区操作数并对选定结果执行搜索、排序和可选分页。
 * 1.0.4 引入工作区操作数（= Skills Manager 已知 tool）。
 * 作者：NDP Coding
 * 日期：2026-07-17 11:50:00
 */
import type { ComparisonInput } from "@/shared/contracts/comparison";
import type { SkillSummary } from "@/shared/contracts/catalog";
import { compareSkillSets } from "@/shared/domain/skill-comparison";
import { listScenarios, listSkills, listSources } from "./catalog-service";
import { DomainError } from "./domain-error";
import { compareNames } from "@/shared/domain/locale-compare";
import { openReadDatabase } from "../database/open-database";
import {
  enabledSkillIdsInTool,
  knownWorkspaceTools,
} from "./workspace-service";

function allSkillItems(databasePath: string): SkillSummary[] {
  const first = listSkills(databasePath, {
    page: 1,
    pageSize: 100,
    sort: "name",
    order: "asc",
  });
  const items = [...first.items];
  for (let page = 2; items.length < first.total; page += 1) {
    items.push(
      ...listSkills(databasePath, {
        page,
        pageSize: 100,
        sort: "name",
        order: "asc",
      }).items,
    );
  }
  return items;
}

function allSources(databasePath: string) {
  const first = listSources(databasePath, {
    page: 1,
    pageSize: 100,
    sort: "name",
    order: "asc",
  });
  const items = [...first.items];
  for (let page = 2; items.length < first.total; page += 1) {
    items.push(
      ...listSources(databasePath, {
        page,
        pageSize: 100,
        sort: "name",
        order: "asc",
      }).items,
    );
  }
  return items;
}

function allScenarios(databasePath: string) {
  const first = listScenarios(databasePath, {
    page: 1,
    pageSize: 100,
    sort: "sortOrder",
    order: "asc",
  });
  const items = [...first.items];
  for (let page = 2; items.length < first.total; page += 1) {
    items.push(
      ...listScenarios(databasePath, {
        page,
        pageSize: 100,
        sort: "sortOrder",
        order: "asc",
      }).items,
    );
  }
  return items;
}

function operandIds(
  databasePath: string,
  operand: ComparisonInput["left"],
  skills: SkillSummary[],
): string[] {
  if (operand.type === "source") {
    const sources = allSources(databasePath);
    if (!sources.some((source) => source.id === operand.id))
      throw new DomainError("VALIDATION_ERROR", "指定来源不存在。", 400);
    return skills
      .filter((skill) => skill.source?.id === operand.id)
      .map((skill) => skill.id);
  }
  if (operand.type === "scenario") {
    const scenarios = allScenarios(databasePath);
    if (!scenarios.some((scenario) => scenario.id === operand.id))
      throw new DomainError("SCENARIO_NOT_FOUND", "指定场景不存在。", 404);
    return skills
      .filter((skill) =>
        skill.scenarios.some((scenario) => scenario.id === operand.id),
      )
      .map((skill) => skill.id);
  }
  // type === "workspace"
  const database = openReadDatabase(databasePath);
  try {
    if (!knownWorkspaceTools(database).includes(operand.id))
      throw new DomainError("WORKSPACE_NOT_FOUND", "指定工作区不存在。", 404);
    const { skillIds } = enabledSkillIdsInTool(database, operand.id);
    return [...skillIds];
  } finally {
    database.close();
  }
}

export function compareSkills(databasePath: string, input: ComparisonInput) {
  const skills = allSkillItems(databasePath);
  const left = operandIds(databasePath, input.left, skills);
  const right = operandIds(databasePath, input.right, skills);
  const comparison = compareSkillSets(left, right);
  const selected = new Set(comparison[input.result]);
  const needle = input.q?.toLocaleLowerCase();
  const sign = input.order === "asc" ? 1 : -1;
  const items = skills.filter(
    (skill) =>
      selected.has(skill.id) &&
      (!needle ||
        skill.name.toLocaleLowerCase().includes(needle) ||
        skill.description?.toLocaleLowerCase().includes(needle)),
  );
  items.sort(
    (a, b) =>
      sign *
      (input.sort === "updatedAt"
        ? (a.updatedAt || 0) - (b.updatedAt || 0) ||
          compareNames(a.name, b.name)
        : compareNames(a.name, b.name)),
  );
  return {
    leftTotal: new Set(left).size,
    rightTotal: new Set(right).size,
    counts: {
      common: comparison.common.length,
      leftOnly: comparison.leftOnly.length,
      rightOnly: comparison.rightOnly.length,
      difference: comparison.difference.length,
    },
    items:
      input.pageSize === 0
        ? items
        : items.slice(
            (input.page - 1) * input.pageSize,
            input.page * input.pageSize,
          ),
    total: items.length,
  };
}
