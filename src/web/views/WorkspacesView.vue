<!--
  工作区列表：按真实启用状态筛选已知工作区（= Skills Manager 工具）并渲染为可点击卡片。
  1.0.4 引入。
  作者：NDP Coding
 * 日期：2026-07-18 10:00:00
-->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import type { Workspace } from "@/shared/contracts/catalog";
import { catalogApi } from "../api/catalog-api";
import RequestState from "../components/RequestState.vue";
import {
  filterWorkspacesByStatus,
  type WorkspaceStatusFilter,
  workspaceStatusFilterFromQuery,
} from "../domain/workspace-filter";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const items = ref<Workspace[]>([]);
const loading = ref(true);
const error = ref("");
const statusFilter = computed<WorkspaceStatusFilter>({
  get: () => workspaceStatusFilterFromQuery(route.query.status),
  set: (status) => {
    void router.replace({
      query: {
        ...route.query,
        status: status === "enabled" ? undefined : status,
      },
    });
  },
});
const filteredItems = computed(() =>
  filterWorkspacesByStatus(items.value, statusFilter.value),
);
const emptyText = computed(() =>
  statusFilter.value === "enabled"
    ? t("workspaces.emptyEnabled")
    : statusFilter.value === "disabled"
      ? t("workspaces.emptyDisabled")
      : t("workspaces.empty"),
);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const result = await catalogApi.workspaces();
    items.value = result.data;
  } catch (reason) {
    error.value =
      reason instanceof Error ? reason.message : t("workspaces.errorFallback");
  } finally {
    loading.value = false;
  }
}
function open(name: string): void {
  void router.push(`/workspaces/${encodeURIComponent(name)}`);
}
onMounted(load);
</script>

<template>
  <section class="page">
    <p class="eyebrow">{{ t("workspaces.eyebrow") }}</p>
    <h1>{{ t("workspaces.title") }}</h1>
    <p class="lead">{{ t("workspaces.lead") }}</p>
    <div v-if="!loading && !error && items.length" class="workspace-toolbar">
      <label for="workspace-status-filter">{{
        t("workspaces.filter.label")
      }}</label>
      <a-select
        id="workspace-status-filter"
        v-model:value="statusFilter"
        class="workspace-status-filter"
        :aria-label="t('workspaces.filter.label')"
      >
        <a-select-option value="enabled">{{
          t("workspaces.filter.enabled")
        }}</a-select-option>
        <a-select-option value="disabled">{{
          t("workspaces.filter.disabled")
        }}</a-select-option>
        <a-select-option value="all">{{
          t("workspaces.filter.all")
        }}</a-select-option>
      </a-select>
    </div>
    <request-state
      :loading="loading"
      :error="error"
      :empty="filteredItems.length === 0"
      :empty-text="emptyText"
      @retry="load"
    >
      <div class="workspace-grid" data-testid="workspace-grid">
        <button
          v-for="ws in filteredItems"
          :key="ws.name"
          type="button"
          class="workspace-card"
          :data-testid="`workspace-${ws.name}`"
          @click="open(ws.name)"
        >
          <span class="workspace-name">{{ ws.name }}</span>
          <span :class="['workspace-tag', { disabled: !ws.enabled }]">{{
            ws.enabled ? t("workspaces.enabled") : t("workspaces.disabled")
          }}</span>
          <ul class="workspace-counts">
            <li>
              {{
                t("workspaces.enabledSkillCount", {
                  count: ws.enabledSkillCount,
                })
              }}
            </li>
            <li>
              {{
                t("workspaces.enabledScenarioCount", {
                  count: ws.enabledScenarioCount,
                })
              }}
            </li>
          </ul>
        </button>
      </div>
    </request-state>
  </section>
</template>

<style scoped src="../styles/views/workspaces.css"></style>
