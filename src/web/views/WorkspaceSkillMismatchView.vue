<!--
  分析详情：工作区 Skill 错配清单。展示"已设置到场景、场景已应用到工作区、但 Skill
  未在工作区启用"的 Skill，复用 SkillListView 共享组件展示。
  1.0.6 引入。
  作者：NDP Coding
 * 日期：2026-07-18 09:30:00
-->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import type { SkillSummary } from "@/shared/contracts/catalog";
import type { WorkspaceSkillMismatch } from "@/shared/contracts/analysis";
import { catalogApi } from "../api/catalog-api";
import RequestState from "../components/RequestState.vue";
import SkillListView from "../components/SkillListView.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const items = ref<WorkspaceSkillMismatch[]>([]);
const loading = ref(true);
const error = ref("");

const groupedByWorkspace = computed(() => {
  const groups = new Map<string, WorkspaceSkillMismatch[]>();
  for (const item of items.value) {
    const list = groups.get(item.workspace) ?? [];
    list.push(item);
    groups.set(item.workspace, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
});

const workspaceItems = computed(() => {
  const out: Array<{
    workspace: string;
    skills: SkillSummary[];
  }> = [];
  for (const [workspace, list] of groupedByWorkspace.value) {
    const seen = new Set<string>();
    const unique: SkillSummary[] = [];
    for (const item of list) {
      if (seen.has(item.skill.id)) continue;
      seen.add(item.skill.id);
      unique.push(item.skill);
    }
    out.push({ workspace, skills: unique });
  }
  return out;
});

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const result = await catalogApi.workspaceSkillMismatches();
    items.value = result.data;
  } catch (reason) {
    error.value =
      reason instanceof Error ? reason.message : t("analysis.errorFallback");
  } finally {
    loading.value = false;
  }
}

function back(): void {
  void router.push("/analysis");
}

onMounted(load);
</script>

<template>
  <section class="page">
    <button
      class="back"
      type="button"
      data-testid="back-to-analysis"
      @click="back"
    >
      {{ t("analysis.backToList") }}
    </button>
    <p class="eyebrow">{{ t("analysis.workspaceMismatch.eyebrow") }}</p>
    <h1>{{ t("analysis.workspaceMismatch.title") }}</h1>
    <p class="lead">{{ t("analysis.workspaceMismatch.description") }}</p>
    <request-state
      :loading="loading"
      :error="error"
      :empty="items.length === 0"
      :empty-text="t('analysis.workspaceMismatch.empty')"
      @retry="load"
    >
      <div
        v-for="group in workspaceItems"
        :key="group.workspace"
        class="workspace-group"
        :data-testid="`mismatch-workspace-${group.workspace}`"
      >
        <header class="workspace-group-head">
          <span class="workspace-group-name">{{ group.workspace }}</span>
          <span class="workspace-group-count">
            {{
              t("analysis.workspaceMismatch.skillCount", {
                count: group.skills.length,
              })
            }}
          </span>
        </header>
        <SkillListView :items="group.skills" :from="route.fullPath" />
      </div>
    </request-state>
  </section>
</template>

<style scoped src="../styles/views/analysis-detail.css"></style>
