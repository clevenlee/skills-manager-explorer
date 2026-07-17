/**
 * Skills Manager 数据库兼容检查，只验证应用依赖的表和字段并允许额外结构。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:20:00
 */
import type { Database } from "bun:sqlite";

const requiredSchema = {
  skills: [
    "id",
    "name",
    "description",
    "source_type",
    "source_ref",
    "source_ref_resolved",
    "source_subpath",
    "source_branch",
    "source_revision",
    "remote_revision",
    "central_path",
    "content_hash",
    "enabled",
    "created_at",
    "updated_at",
    "status",
    "update_status",
    "last_checked_at",
    "last_check_error",
  ],
  scenarios: [
    "id",
    "name",
    "description",
    "icon",
    "sort_order",
    "created_at",
    "updated_at",
  ],
  scenario_skills: ["scenario_id", "skill_id", "added_at", "sort_order"],
} as const;

export type SchemaCompatibility = {
  compatible: boolean;
  missing: string[];
};

export function checkSchema(database: Database): SchemaCompatibility {
  const missing: string[] = [];

  for (const [table, requiredColumns] of Object.entries(requiredSchema)) {
    const tableExists = database
      .query<{ name: string }, [string]>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
      )
      .get(table);

    if (!tableExists) {
      missing.push(`table:${table}`);
      continue;
    }

    const columns = new Set(
      database
        .query<{ name: string }, []>(`PRAGMA table_info('${table}')`)
        .all()
        .map(({ name }) => name),
    );
    for (const column of requiredColumns) {
      if (!columns.has(column)) missing.push(`column:${table}.${column}`);
    }
  }

  return { compatible: missing.length === 0, missing };
}
