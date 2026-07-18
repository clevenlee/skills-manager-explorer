/**
 * 业务 API 适配层，以共享 Zod 契约校验概览、目录、详情、比对与归属响应。
 * 作者：NDP Coding
 * 日期：2026-07-17 12:20:00
 */
import {
  assignmentEnvelopeSchema,
  bulkAddSkillScenariosEnvelopeSchema,
  type AssignmentInput,
  type BulkAddSkillScenariosInput,
} from "@/shared/contracts/assignment";
import {
  overviewEnvelopeSchema,
  scenariosEnvelopeSchema,
  skillDetailEnvelopeSchema,
  skillsEnvelopeSchema,
  sourcesEnvelopeSchema,
  workspaceScenariosEnvelopeSchema,
  workspaceSkillsEnvelopeSchema,
  workspacesEnvelopeSchema,
} from "@/shared/contracts/catalog";
import { workspaceSkillMismatchsEnvelopeSchema } from "@/shared/contracts/analysis";
import type { Scenario, Source } from "@/shared/contracts/catalog";
import {
  comparisonEnvelopeSchema,
  type ComparisonInput,
} from "@/shared/contracts/comparison";
import { apiRequest } from "./api-client";

function queryString(
  values: Record<string, string | number | boolean | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== "") params.set(key, String(value));
  return params.toString();
}

export const catalogApi = {
  overview: () => apiRequest("/api/v1/overview", overviewEnvelopeSchema),
  sources: (query: Record<string, string | number | undefined> = {}) =>
    apiRequest(`/api/v1/sources?${queryString(query)}`, sourcesEnvelopeSchema),
  scenarios: (query: Record<string, string | number | undefined> = {}) =>
    apiRequest(
      `/api/v1/scenarios?${queryString(query)}`,
      scenariosEnvelopeSchema,
    ),
  skills: (query: Record<string, string | number | boolean | undefined> = {}) =>
    apiRequest(`/api/v1/skills?${queryString(query)}`, skillsEnvelopeSchema),
  skill: (skillId: string) =>
    apiRequest(
      `/api/v1/skills/${encodeURIComponent(skillId)}`,
      skillDetailEnvelopeSchema,
    ),
  compare: (input: ComparisonInput) =>
    apiRequest("/api/v1/skill-comparisons", comparisonEnvelopeSchema, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  assign: (skillId: string, input: AssignmentInput) =>
    apiRequest(
      `/api/v1/skills/${encodeURIComponent(skillId)}/scenarios`,
      assignmentEnvelopeSchema,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      },
    ),
  bulkAddScenarios: (input: BulkAddSkillScenariosInput) =>
    apiRequest(
      "/api/v1/skills/bulk-add-scenarios",
      bulkAddSkillScenariosEnvelopeSchema,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      },
    ),
  // 1.0.4: 工作区 API
  workspaces: () => apiRequest("/api/v1/workspaces", workspacesEnvelopeSchema),
  workspaceSkills: (name: string) =>
    apiRequest(
      `/api/v1/workspaces/${encodeURIComponent(name)}/skills?page=1&pageSize=100`,
      workspaceSkillsEnvelopeSchema,
    ),
  workspaceScenarios: (name: string) =>
    apiRequest(
      `/api/v1/workspaces/${encodeURIComponent(name)}/scenarios`,
      workspaceScenariosEnvelopeSchema,
    ),
  // 1.0.6: 分析 API
  workspaceSkillMismatches: () =>
    apiRequest(
      "/api/v1/analyses/workspace-skill-mismatches",
      workspaceSkillMismatchsEnvelopeSchema,
    ),
};

async function collectAll<T>(
  loadPage: (page: number) => Promise<{ data: T[]; meta: { total: number } }>,
): Promise<T[]> {
  const first = await loadPage(1);
  const items = [...first.data];
  for (let page = 2; items.length < first.meta.total; page += 1)
    items.push(...(await loadPage(page)).data);
  return items;
}

export const allCatalogApi = {
  sources: (): Promise<Source[]> =>
    collectAll((page) => catalogApi.sources({ page, pageSize: 100 })),
  scenarios: (): Promise<Scenario[]> =>
    collectAll((page) => catalogApi.scenarios({ page, pageSize: 100 })),
};
