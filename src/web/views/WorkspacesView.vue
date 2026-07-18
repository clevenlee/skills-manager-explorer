<!--
  工作区列表：渲染已知工作区（= Skills Manager 工具）作为可点击卡片。
  1.0.4 引入。
  作者：NDP Coding
 * 日期：2026-07-18 10:00:00
-->
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import type { Workspace } from "@/shared/contracts/catalog";
import { catalogApi } from "../api/catalog-api";
import RequestState from "../components/RequestState.vue";

const { t } = useI18n();
const router = useRouter();
const items = ref<Workspace[]>([]);
const loading = ref(true);
const error = ref("");

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
    <request-state
      :loading="loading"
      :error="error"
      :empty="items.length === 0"
      :empty-text="t('workspaces.empty')"
      @retry="load"
    >
      <div class="workspace-grid" data-testid="workspace-grid">
        <button
          v-for="ws in items"
          :key="ws.name"
          type="button"
          class="workspace-card"
          :data-testid="`workspace-${ws.name}`"
          @click="open(ws.name)"
        >
          <span class="workspace-name">{{ ws.name }}</span>
          <span class="workspace-tag">{{ t("workspaces.enabled") }}</span>
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
