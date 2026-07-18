/**
 * 写边界回归测试，静态证明生产服务中仅场景归属服务包含数据写语句。
 * 作者：NDP Coding
 * 日期：2026-07-17 13:50:00
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? sourceFiles(join(directory, entry.name))
      : entry.name.endsWith(".ts")
        ? [join(directory, entry.name)]
        : [],
  );
}

describe("数据库写边界", () => {
  test("只有 assignment-service 含 INSERT/UPDATE/DELETE", () => {
    const root = join(process.cwd(), "src/server");
    const writers = sourceFiles(root)
      .filter((file) =>
        /\b(?:INSERT\s+INTO|UPDATE\s+\w+|DELETE\s+FROM)\b/i.test(
          readFileSync(file, "utf8"),
        ),
      )
      .map((file) => relative(root, file));
    expect(writers).toEqual(["services/assignment-service.ts"]);
    const source = readFileSync(join(root, writers[0]!), "utf8");
    expect(source).toContain("INSERT INTO scenario_skills");
    expect(source).toContain("INSERT OR REPLACE INTO scenario_skill_tools");
    expect(source).toContain("enabled, updated_at) VALUES (?, ?, ?, 0, ?)");
    expect(source).toContain("DELETE FROM scenario_skills");
    expect(source).not.toMatch(
      /(?:INSERT(?:\s+OR\s+REPLACE)?\s+INTO|UPDATE|DELETE FROM)\s+(?:skills|scenarios|active_scenario|settings|skill_targets|projects|audit_log)\b/i,
    );
  });
});
