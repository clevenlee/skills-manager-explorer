/**
 * 同步 Skills Manager 的场景归属元数据，使数据库关联在 GUI 重启重建后仍然保留。
 * 仅在目标库旁存在完整元数据快照时启用；临时 fixture 或旧版数据库继续只写 SQLite。
 * 作者：NDP Coding
 * 日期：2026-07-18 10:10:00
 */
import { randomUUID } from "node:crypto";
import {
  existsSync,
  linkSync,
  mkdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, parse } from "node:path";

export type ScenarioMembershipMetadata = {
  scenarioId: string;
  skillId: string;
  sortOrder: number;
  tools: Record<string, false>;
};

export class MetadataWriteError extends Error {
  constructor() {
    super("Skills Manager 场景归属元数据写入失败。");
    this.name = "MetadataWriteError";
  }
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function metadataRoot(databasePath: string): string | null {
  const candidate = join(dirname(databasePath), "skills", ".skills-manager");
  if (
    existsSync(join(candidate, "schema.json")) &&
    isDirectory(join(candidate, "skills")) &&
    isDirectory(join(candidate, "scenarios"))
  )
    return candidate;
  return null;
}

function assertSafeIdentifier(value: string): void {
  const parsed = parse(value);
  if (
    !value ||
    parsed.base !== value ||
    value === "." ||
    value === ".." ||
    value.includes("/") ||
    value.includes("\\")
  )
    throw new MetadataWriteError();
}

export function removeCreatedMembershipMetadata(paths: string[]): void {
  for (const path of paths) rmSync(path, { force: true });
  paths.length = 0;
}

/**
 * 创建新增关联对应的元数据文件。最终文件使用硬链接原子落位，避免覆盖 GUI 同时写入的文件。
 * `createdPaths` 由调用方保留到 SQLite 提交完成；若提交失败，可据此删除本次新增文件。
 */
export function persistAddedMembershipMetadata(
  databasePath: string,
  memberships: ScenarioMembershipMetadata[],
  createdPaths: string[],
): void {
  const root = metadataRoot(databasePath);
  if (!root || memberships.length === 0) return;

  const temporaryPaths: string[] = [];
  try {
    for (const membership of memberships) {
      assertSafeIdentifier(membership.scenarioId);
      assertSafeIdentifier(membership.skillId);
      const scenarioDirectory = join(
        root,
        "scenario-skills",
        membership.scenarioId,
      );
      mkdirSync(scenarioDirectory, { recursive: true });
      const finalPath = join(scenarioDirectory, `${membership.skillId}.json`);
      if (existsSync(finalPath)) continue;

      const temporaryPath = join(
        scenarioDirectory,
        `.${membership.skillId}.${randomUUID()}.tmp`,
      );
      temporaryPaths.push(temporaryPath);
      writeFileSync(
        temporaryPath,
        `${JSON.stringify(
          {
            schema_version: 1,
            scenario_id: membership.scenarioId,
            skill_id: membership.skillId,
            sort_order: membership.sortOrder,
            tools: membership.tools,
          },
          null,
          2,
        )}\n`,
        { flag: "wx", mode: 0o600 },
      );
      try {
        linkSync(temporaryPath, finalPath);
        createdPaths.push(finalPath);
      } catch (error) {
        if (!(
          error instanceof Error &&
          "code" in error &&
          error.code === "EEXIST"
        ))
          throw error;
      } finally {
        rmSync(temporaryPath, { force: true });
        temporaryPaths.pop();
      }
    }
  } catch {
    for (const path of temporaryPaths) rmSync(path, { force: true });
    removeCreatedMembershipMetadata(createdPaths);
    throw new MetadataWriteError();
  }
}
