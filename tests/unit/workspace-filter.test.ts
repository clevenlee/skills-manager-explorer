/**
 * 工作区状态筛选测试，默认视图只展示已启用工作区。
 * 作者：NDP Coding
 * 日期：2026-07-18 11:30:00
 */
import { describe, expect, test } from "bun:test";

import type { Workspace } from "@/shared/contracts/catalog";
import {
  filterWorkspacesByStatus,
  type WorkspaceStatusFilter,
  workspaceStatusFilterFromQuery,
} from "@/web/domain/workspace-filter";

const workspaces: Workspace[] = [
  {
    name: "codex",
    enabled: true,
    enabledSkillCount: 2,
    enabledScenarioCount: 1,
  },
  {
    name: "cursor",
    enabled: false,
    enabledSkillCount: 0,
    enabledScenarioCount: 0,
  },
];

describe("filterWorkspacesByStatus", () => {
  test("缺失或无效 URL 状态默认解析为 enabled", () => {
    expect(workspaceStatusFilterFromQuery(undefined)).toBe("enabled");
    expect(workspaceStatusFilterFromQuery("unknown")).toBe("enabled");
    expect(workspaceStatusFilterFromQuery("disabled")).toBe("disabled");
    expect(workspaceStatusFilterFromQuery("all")).toBe("all");
  });

  test("默认筛选值 enabled 只保留已启用工作区", () => {
    const defaultFilter: WorkspaceStatusFilter = "enabled";
    expect(filterWorkspacesByStatus(workspaces, defaultFilter)).toEqual([
      workspaces[0]!,
    ]);
  });

  test("支持查看未启用和全部工作区", () => {
    expect(filterWorkspacesByStatus(workspaces, "disabled")).toEqual([
      workspaces[1]!,
    ]);
    expect(filterWorkspacesByStatus(workspaces, "all")).toEqual(workspaces);
  });
});
