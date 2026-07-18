import type { Workspace } from "@/shared/contracts/catalog";

export type WorkspaceStatusFilter = "enabled" | "disabled" | "all";

export function workspaceStatusFilterFromQuery(
  value: unknown,
): WorkspaceStatusFilter {
  return value === "disabled" || value === "all" ? value : "enabled";
}

export function filterWorkspacesByStatus(
  workspaces: Workspace[],
  status: WorkspaceStatusFilter,
): Workspace[] {
  if (status === "all") return workspaces;
  const enabled = status === "enabled";
  return workspaces.filter((workspace) => workspace.enabled === enabled);
}
