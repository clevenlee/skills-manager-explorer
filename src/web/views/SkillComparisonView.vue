<!--
  Skill 集合比对工作台，支持来源与场景混合操作数、四种结果视图、交换和 URL 恢复。
  标签、四种视图、占位符、错误兜底文案经 useI18n() 国际化。
  作者：NDP Coding
  日期：2026-07-17 13:05:00
-->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import type {
  Scenario,
  SkillSummary,
  Source,
  Workspace,
} from "@/shared/contracts/catalog";
import type { ComparisonInput } from "@/shared/contracts/comparison";
import { allCatalogApi, catalogApi } from "../api/catalog-api";
import { useLocale } from "../composables/useLocale";
import RequestState from "../components/RequestState.vue";

type ResultType = ComparisonInput["result"];
const { t } = useI18n();
const { formatNumber } = useLocale();
const route = useRoute();
const router = useRouter();
const sources = ref<Source[]>([]);
const scenarios = ref<Scenario[]>([]);
const workspaces = ref<Workspace[]>([]);
const items = ref<SkillSummary[]>([]);
const counts = ref({ common: 0, leftOnly: 0, rightOnly: 0, difference: 0 });
const leftTotal = ref(0);
const rightTotal = ref(0);
const total = ref(0);
const loading = ref(true);
const error = ref("");
const left = ref(String(route.query.left || ""));
const right = ref(String(route.query.right || ""));
const result = ref<ResultType>(
  (route.query.result as ResultType) || "difference",
);
const q = ref(String(route.query.q || ""));
const page = ref(Number(route.query.page || 1));
const options = computed(() => [
  {
    label: t("nav.sources"),
    options: sources.value.map((item) => ({
      label: item.name,
      value: `source:${item.id}`,
    })),
  },
  {
    label: t("nav.scenarios"),
    options: scenarios.value.map((item) => ({
      label: item.name,
      value: `scenario:${item.id}`,
    })),
  },
  {
    label: t("nav.workspaces"),
    options: workspaces.value.map((item) => ({
      label: item.name,
      value: `workspace:${item.name}`,
    })),
  },
]);
const tabs = computed(() => [
  {
    label: `${t("comparison.tabs.difference")} ${formatNumber(counts.value.difference)}`,
    value: "difference",
  },
  {
    label: `${t("comparison.tabs.common")} ${formatNumber(counts.value.common)}`,
    value: "common",
  },
  {
    label: `${t("comparison.tabs.leftOnly")} ${formatNumber(counts.value.leftOnly)}`,
    value: "leftOnly",
  },
  {
    label: `${t("comparison.tabs.rightOnly")} ${formatNumber(counts.value.rightOnly)}`,
    value: "rightOnly",
  },
]);
function operand(value: string) {
  const separator = value.indexOf(":");
  return {
    type: value.slice(0, separator) as "source" | "scenario",
    id: value.slice(separator + 1),
  };
}
function queryValues() {
  return {
    left: left.value || undefined,
    right: right.value || undefined,
    result: result.value === "difference" ? undefined : result.value,
    q: q.value || undefined,
    page: page.value === 1 ? undefined : String(page.value),
  };
}
async function syncUrl() {
  await router.replace({ query: queryValues() });
}
async function loadComparison() {
  await syncUrl();
  if (!left.value || !right.value) {
    items.value = [];
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const response = await catalogApi.compare({
      left: operand(left.value),
      right: operand(right.value),
      result: result.value,
      q: q.value || undefined,
      sort: "name",
      order: "asc",
      page: page.value,
      pageSize: 12,
    });
    items.value = response.data.items;
    counts.value = response.data.counts;
    leftTotal.value = response.data.leftTotal;
    rightTotal.value = response.data.rightTotal;
    total.value = response.meta.total;
  } catch (reason) {
    error.value =
      reason instanceof Error ? reason.message : t("comparison.errorFallback");
  } finally {
    loading.value = false;
  }
}
async function initialize() {
  loading.value = true;
  try {
    const [sourceResponse, scenarioResponse, workspacesRes] = await Promise.all(
      [
        allCatalogApi.sources(),
        allCatalogApi.scenarios(),
        catalogApi.workspaces(),
      ],
    );
    sources.value = sourceResponse;
    scenarios.value = scenarioResponse;
    workspaces.value = workspacesRes.data;
    await loadComparison();
  } catch (reason) {
    error.value =
      reason instanceof Error
        ? reason.message
        : t("comparison.optionsErrorFallback");
    loading.value = false;
  }
}
async function changeOperands() {
  page.value = 1;
  await loadComparison();
}
async function changeResult(value: string | number) {
  result.value = value as ResultType;
  page.value = 1;
  await loadComparison();
}
async function swap() {
  [left.value, right.value] = [right.value, left.value];
  page.value = 1;
  await loadComparison();
}
async function changePage(next: number) {
  page.value = next;
  await loadComparison();
}
onMounted(initialize);
</script>

<template>
  <section class="page">
    <p class="eyebrow">{{ t("comparison.eyebrow") }}</p>
    <h1>{{ t("comparison.title") }}</h1>
    <p class="lead">{{ t("comparison.lead") }}</p>
    <div class="operand-panel">
      <div>
        <label>{{ t("comparison.operandLabel.left") }}</label
        ><a-select
          v-model:value="left"
          :options="options"
          show-search
          :placeholder="t('comparison.placeholder')"
          @change="changeOperands"
        />
      </div>
      <a-button
        class="swap"
        :aria-label="t('comparison.swapAria')"
        @click="swap"
        >⇄</a-button
      >
      <div>
        <label>{{ t("comparison.operandLabel.right") }}</label
        ><a-select
          v-model:value="right"
          :options="options"
          show-search
          :placeholder="t('comparison.placeholder')"
          @change="changeOperands"
        />
      </div>
    </div>
    <request-state :loading="loading" :error="error" @retry="loadComparison">
      <a-empty
        v-if="!left || !right"
        :description="t('comparison.emptyOperands')"
      />
      <template v-else
        ><div class="summary">
          <span
            >{{ t("comparison.summary.left") }}
            <strong>{{ formatNumber(leftTotal) }}</strong></span
          ><span
            >{{ t("comparison.summary.right") }}
            <strong>{{ formatNumber(rightTotal) }}</strong></span
          ><a-segmented
            :value="result"
            :options="tabs"
            @change="changeResult"
          />
        </div>
        <a-input-search
          v-model:value="q"
          class="search"
          allow-clear
          :placeholder="t('comparison.searchPlaceholder')"
          @search="changeOperands"
        />
        <a-empty
          v-if="items.length === 0"
          :description="t('comparison.emptyResult')"
        />
        <div v-else class="result-list">
          <router-link
            v-for="skill in items"
            :key="skill.id"
            :to="{
              name: 'skill-detail',
              params: { skillId: skill.id },
              query: { from: route.fullPath },
            }"
            ><div>
              <strong>{{ skill.name }}</strong>
              <p>{{ skill.description || t("common.noDescription") }}</p>
            </div>
            <span
              >{{ skill.source?.name || t("common.unknownSource") }} →</span
            ></router-link
          >
        </div>
        <a-pagination
          v-if="total > 12"
          :current="page"
          :page-size="12"
          :total="total"
          :show-size-changer="false"
          @change="changePage"
        />
      </template>
    </request-state>
  </section>
</template>

<style scoped src="../styles/views/comparison.css"></style>
