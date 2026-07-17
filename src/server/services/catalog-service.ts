/**
 * 只读目录服务，集中实现概览、来源、场景、Skill 筛选与详情映射。
 * 作者：NDP Coding
 * 日期：2026-07-17 11:40:00
 */
import type { Database } from "bun:sqlite";

import type {
  Scenario,
  SkillDetail,
  SkillSummary,
  Source,
} from "@/shared/contracts/catalog";
import { openReadDatabase } from "../database/open-database";
import { DomainError } from "./domain-error";
import { normalizeSource } from "./normalize-source";

type RawSkill = {
  id: string;
  name: string;
  description: string | null;
  source_type: string | null;
  source_ref: string | null;
  source_ref_resolved: string | null;
  source_subpath: string | null;
  source_branch: string | null;
  source_revision: string | null;
  remote_revision: string | null;
  central_path: string | null;
  content_hash: string | null;
  enabled: number;
  created_at: number | null;
  updated_at: number | null;
  status: string | null;
  update_status: string | null;
  last_checked_at: number | null;
  last_check_error: string | null;
};
type RawScenario = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  created_at: number | null;
  updated_at: number | null;
  skill_count?: number;
};
type ScenarioLink = {
  skill_id: string;
  id: string;
  name: string;
  sort_order: number;
};

function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; total: number } {
  return {
    items:
      pageSize === 0
        ? items
        : items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
  };
}
function direction(order: "asc" | "desc"): number {
  return order === "asc" ? 1 : -1;
}
function allSkills(database: Database): RawSkill[] {
  return database.query<RawSkill, []>("SELECT * FROM skills").all();
}
function scenarioMap(
  database: Database,
): Map<string, SkillSummary["scenarios"]> {
  const rows = database
    .query<ScenarioLink, []>(
      `SELECT ss.skill_id, s.id, s.name, s.sort_order FROM scenario_skills ss JOIN scenarios s ON s.id = ss.scenario_id ORDER BY s.sort_order, s.name`,
    )
    .all();
  const result = new Map<string, SkillSummary["scenarios"]>();
  for (const row of rows)
    result.set(row.skill_id, [
      ...(result.get(row.skill_id) || []),
      { id: row.id, name: row.name, sortOrder: row.sort_order },
    ]);
  return result;
}
function toSummary(
  row: RawSkill,
  links: Map<string, SkillSummary["scenarios"]>,
): SkillSummary {
  const normalized = normalizeSource({
    sourceType: row.source_type,
    sourceRef: row.source_ref,
    sourceRefResolved: row.source_ref_resolved,
  });
  const hasSource = Boolean(
    row.source_ref_resolved || row.source_ref || row.source_type,
  );
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    enabled: Boolean(row.enabled),
    status: row.status,
    updateStatus: row.update_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    scenarios: links.get(row.id) || [],
    source: hasSource
      ? {
          id: normalized.id,
          name: normalized.name,
          type: normalized.type,
          externalUrl: normalized.externalUrl,
        }
      : null,
  };
}

export function getOverview(databasePath: string) {
  const database = openReadDatabase(databasePath);
  try {
    const rows = allSkills(database);
    const sourceIds = new Set(
      rows.map(
        (row) =>
          normalizeSource({
            sourceType: row.source_type,
            sourceRef: row.source_ref,
            sourceRefResolved: row.source_ref_resolved,
          }).id,
      ),
    );
    const scenarios =
      database
        .query<{ count: number }, []>("SELECT COUNT(*) AS count FROM scenarios")
        .get()?.count || 0;
    const orphanSkills =
      database
        .query<{ count: number }, []>(
          "SELECT COUNT(*) AS count FROM skills s WHERE NOT EXISTS (SELECT 1 FROM scenario_skills ss WHERE ss.skill_id = s.id)",
        )
        .get()?.count || 0;
    const multiScenarioSkills =
      database
        .query<{ count: number }, []>(
          "SELECT COUNT(*) AS count FROM (SELECT skill_id FROM scenario_skills GROUP BY skill_id HAVING COUNT(*) > 1)",
        )
        .get()?.count || 0;
    return {
      skills: rows.length,
      sources: sourceIds.size,
      scenarios,
      orphanSkills,
      multiScenarioSkills,
    };
  } finally {
    database.close();
  }
}

export function listSources(
  databasePath: string,
  query: {
    q?: string;
    page: number;
    pageSize: number;
    sort: "name" | "skillCount";
    order: "asc" | "desc";
  },
) {
  const database = openReadDatabase(databasePath);
  try {
    const links = scenarioMap(database);
    const grouped = new Map<string, Source>();
    for (const skill of allSkills(database)) {
      const source = normalizeSource({
        sourceType: skill.source_type,
        sourceRef: skill.source_ref,
        sourceRefResolved: skill.source_ref_resolved,
      });
      const current = grouped.get(source.id) || {
        ...source,
        skillCount: 0,
        assignedSkillCount: 0,
        orphanSkillCount: 0,
      };
      current.skillCount += 1;
      if ((links.get(skill.id)?.length || 0) > 0)
        current.assignedSkillCount += 1;
      else current.orphanSkillCount += 1;
      grouped.set(source.id, current);
    }
    const needle = query.q?.toLocaleLowerCase();
    const items = [...grouped.values()].filter(
      (item) =>
        !needle ||
        item.name.toLocaleLowerCase().includes(needle) ||
        item.key.toLocaleLowerCase().includes(needle),
    );
    const sign = direction(query.order);
    items.sort(
      (a, b) =>
        sign *
        (query.sort === "skillCount"
          ? a.skillCount - b.skillCount || a.name.localeCompare(b.name, "zh-CN")
          : a.name.localeCompare(b.name, "zh-CN")),
    );
    return paginate(items, query.page, query.pageSize);
  } finally {
    database.close();
  }
}

export function listScenarios(
  databasePath: string,
  query: {
    q?: string;
    page: number;
    pageSize: number;
    sort: "sortOrder" | "name" | "skillCount";
    order: "asc" | "desc";
  },
) {
  const database = openReadDatabase(databasePath);
  try {
    const rows = database
      .query<RawScenario, []>(
        `SELECT s.*, COUNT(ss.skill_id) AS skill_count FROM scenarios s LEFT JOIN scenario_skills ss ON ss.scenario_id = s.id GROUP BY s.id`,
      )
      .all();
    const needle = query.q?.toLocaleLowerCase();
    const items: Scenario[] = rows
      .filter((row) => !needle || row.name.toLocaleLowerCase().includes(needle))
      .map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        icon: row.icon,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        skillCount: row.skill_count || 0,
      }));
    const sign = direction(query.order);
    items.sort(
      (a, b) =>
        sign *
        (query.sort === "name"
          ? a.name.localeCompare(b.name, "zh-CN")
          : query.sort === "skillCount"
            ? a.skillCount - b.skillCount ||
              a.name.localeCompare(b.name, "zh-CN")
            : a.sortOrder - b.sortOrder ||
              a.name.localeCompare(b.name, "zh-CN")),
    );
    return paginate(items, query.page, query.pageSize);
  } finally {
    database.close();
  }
}

export function listSkills(
  databasePath: string,
  query: {
    q?: string;
    page: number;
    pageSize: number;
    sort: "name" | "createdAt" | "updatedAt" | "status";
    order: "asc" | "desc";
    sourceIds?: string;
    scenarioIds?: string;
    orphan?: "true" | "false";
    multiScenario?: "true" | "false";
  },
) {
  const database = openReadDatabase(databasePath);
  try {
    const links = scenarioMap(database);
    const sourceIds = new Set(query.sourceIds?.split(",").filter(Boolean));
    const scenarioIds = new Set(query.scenarioIds?.split(",").filter(Boolean));
    const needle = query.q?.toLocaleLowerCase();
    const items = allSkills(database)
      .map((row) => toSummary(row, links))
      .filter((skill) => {
        const textMatches =
          !needle ||
          skill.name.toLocaleLowerCase().includes(needle) ||
          skill.description?.toLocaleLowerCase().includes(needle);
        const sourceMatches =
          sourceIds.size === 0 ||
          (skill.source && sourceIds.has(skill.source.id));
        const scenarioMatches =
          scenarioIds.size === 0 ||
          skill.scenarios.some((scenario) => scenarioIds.has(scenario.id));
        const orphanMatches =
          query.orphan !== "true" || skill.scenarios.length === 0;
        const multiScenarioMatches =
          query.multiScenario !== "true" || skill.scenarios.length > 1;
        return Boolean(
          textMatches &&
          sourceMatches &&
          scenarioMatches &&
          orphanMatches &&
          multiScenarioMatches,
        );
      });
    const sign = direction(query.order);
    items.sort(
      (a, b) =>
        sign *
        (query.sort === "updatedAt" || query.sort === "createdAt"
          ? (query.sort === "updatedAt"
              ? (a.updatedAt ?? 0)
              : (a.createdAt ?? 0)) -
              (query.sort === "updatedAt"
                ? (b.updatedAt ?? 0)
                : (b.createdAt ?? 0)) || a.name.localeCompare(b.name, "zh-CN")
          : query.sort === "status"
            ? (a.status || "").localeCompare(b.status || "", "zh-CN") ||
              a.name.localeCompare(b.name, "zh-CN")
            : a.name.localeCompare(b.name, "zh-CN")),
    );
    return paginate(items, query.page, query.pageSize);
  } finally {
    database.close();
  }
}

export function getSkillDetail(
  databasePath: string,
  skillId: string,
): SkillDetail {
  const database = openReadDatabase(databasePath);
  try {
    const row = database
      .query<RawSkill, [string]>("SELECT * FROM skills WHERE id = ?")
      .get(skillId);
    if (!row)
      throw new DomainError("SKILL_NOT_FOUND", "未找到指定 Skill。", 404);
    const summary = toSummary(row, scenarioMap(database));
    return {
      ...summary,
      sourceType: row.source_type,
      sourceRef: row.source_ref,
      sourceRefResolved: row.source_ref_resolved,
      sourceSubpath: row.source_subpath,
      sourceBranch: row.source_branch,
      sourceRevision: row.source_revision,
      remoteRevision: row.remote_revision,
      centralPath: row.central_path,
      contentHash: row.content_hash,
      createdAt: row.created_at,
      lastCheckedAt: row.last_checked_at,
      lastCheckError: row.last_check_error,
    };
  } finally {
    database.close();
  }
}
