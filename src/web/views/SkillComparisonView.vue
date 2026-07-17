<!--
  Skill 集合比对工作台，支持来源与场景混合操作数、四种结果视图、交换和 URL 恢复。
  作者：NDP Coding
  日期：2026-07-17 13:05:00
-->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import type {
  Scenario,
  SkillSummary,
  Source,
} from "@/shared/contracts/catalog";
import type { ComparisonInput } from "@/shared/contracts/comparison";
import { allCatalogApi, catalogApi } from "../api/catalog-api";
import RequestState from "../components/RequestState.vue";

type ResultType = ComparisonInput["result"];
const route = useRoute();
const router = useRouter();
const sources = ref<Source[]>([]);
const scenarios = ref<Scenario[]>([]);
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
    label: "来源",
    options: sources.value.map((item) => ({
      label: item.name,
      value: `source:${item.id}`,
    })),
  },
  {
    label: "场景",
    options: scenarios.value.map((item) => ({
      label: item.name,
      value: `scenario:${item.id}`,
    })),
  },
]);
const tabs = computed(() => [
  { label: `差异 ${counts.value.difference}`, value: "difference" },
  { label: `共有 ${counts.value.common}`, value: "common" },
  { label: `仅左 ${counts.value.leftOnly}`, value: "leftOnly" },
  { label: `仅右 ${counts.value.rightOnly}`, value: "rightOnly" },
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
    error.value = reason instanceof Error ? reason.message : "无法完成比对。";
  } finally {
    loading.value = false;
  }
}
async function initialize() {
  loading.value = true;
  try {
    const [sourceResponse, scenarioResponse] = await Promise.all([
      allCatalogApi.sources(),
      allCatalogApi.scenarios(),
    ]);
    sources.value = sourceResponse;
    scenarios.value = scenarioResponse;
    await loadComparison();
  } catch (reason) {
    error.value =
      reason instanceof Error ? reason.message : "无法加载比对选项。";
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
    <p class="eyebrow">SET COMPARISON</p>
    <h1>集合比对</h1>
    <p class="lead">任意选择两个来源或场景，看见共有能力与各自缺口。</p>
    <div class="operand-panel">
      <div>
        <label>左侧集合</label
        ><a-select
          v-model:value="left"
          :options="options"
          show-search
          placeholder="选择来源或场景"
          @change="changeOperands"
        />
      </div>
      <a-button class="swap" aria-label="交换左右集合" @click="swap"
        >⇄</a-button
      >
      <div>
        <label>右侧集合</label
        ><a-select
          v-model:value="right"
          :options="options"
          show-search
          placeholder="选择来源或场景"
          @change="changeOperands"
        />
      </div>
    </div>
    <request-state :loading="loading" :error="error" @retry="loadComparison">
      <a-empty v-if="!left || !right" description="先选择左右两个集合" />
      <template v-else
        ><div class="summary">
          <span
            >左侧 <strong>{{ leftTotal }}</strong></span
          ><span
            >右侧 <strong>{{ rightTotal }}</strong></span
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
          placeholder="在当前结果中搜索"
          @search="changeOperands"
        />
        <a-empty v-if="items.length === 0" description="当前视图没有 Skill" />
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
              <p>{{ skill.description || "暂无描述" }}</p>
            </div>
            <span>{{ skill.source?.name || "未知来源" }} →</span></router-link
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

<style scoped>
.page {
  max-width: 1050px;
}
.eyebrow {
  margin: 0 0 10px;
  color: #648078;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}
h1 {
  margin: 0;
  font-family: Georgia, "Songti SC", serif;
  font-size: clamp(46px, 7vw, 76px);
  font-weight: 600;
  letter-spacing: -0.05em;
}
.lead {
  margin: 18px 0 36px;
  color: #657871;
  font-size: 17px;
}
.operand-panel {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: end;
  margin-bottom: 32px;
  padding: 24px;
  border-radius: 22px;
  background: #245c4c;
}
.operand-panel > div {
  display: grid;
  gap: 8px;
}
.operand-panel label {
  color: #d7e7e0;
  font-size: 12px;
  font-weight: 700;
}
.swap {
  margin-bottom: 1px;
}
.summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
.summary > span {
  color: #61766e;
}
.summary strong {
  margin-left: 4px;
  color: #19342d;
  font-family: Georgia, serif;
  font-size: 26px;
}
.search {
  max-width: 430px;
  margin-bottom: 18px;
}
.result-list {
  display: grid;
  gap: 10px;
  margin-bottom: 24px;
}
.result-list > a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 20px;
  border: 1px solid rgb(25 52 45 / 12%);
  border-radius: 14px;
  background: #fffdf7;
  text-decoration: none;
}
.result-list p {
  margin: 5px 0 0;
  color: #687a74;
}
.result-list > a > span {
  color: #527167;
  font-size: 12px;
}
@media (max-width: 720px) {
  .operand-panel {
    grid-template-columns: 1fr;
  }
  .swap {
    justify-self: center;
    transform: rotate(90deg);
  }
  .summary {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .result-list > a {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
