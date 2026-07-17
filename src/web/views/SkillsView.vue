<!--
  Skill 清单页面，把搜索、来源、场景、孤立状态、排序和分页完整保存在 URL。
  搜索占位、排序、视图、状态、错误兜底文案经 useI18n() 国际化。
  作者：NDP Coding
  日期：2026-07-17 12:50:00
-->
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import type {
  Scenario,
  SkillSummary,
  Source,
} from "@/shared/contracts/catalog";
import { allCatalogApi, catalogApi } from "../api/catalog-api";
import RequestState from "../components/RequestState.vue";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const items = ref<SkillSummary[]>([]);
const sources = ref<Source[]>([]);
const scenarios = ref<Scenario[]>([]);
const total = ref(0);
const loading = ref(true);
const error = ref("");
const q = ref(String(route.query.q || ""));
const sourceIds = ref(
  String(route.query.sourceIds || "")
    .split(",")
    .filter(Boolean),
);
const scenarioIds = ref(
  String(route.query.scenarioIds || "")
    .split(",")
    .filter(Boolean),
);
const orphan = ref(route.query.orphan === "true");
const multiScenario = ref(route.query.multiScenario === "true");
const sort = ref(String(route.query.sort || "name"));
const order = ref(String(route.query.order || "asc"));
const page = ref(Number(route.query.page || 1));
const pageSize = ref(
  [20, 50].includes(Number(route.query.pageSize))
    ? Number(route.query.pageSize)
    : 0,
);
const viewMode = ref<"grid" | "table">(
  route.query.view === "table" ? "table" : "grid",
);
function queryValues() {
  return {
    q: q.value || undefined,
    sourceIds: sourceIds.value.join(",") || undefined,
    scenarioIds: scenarioIds.value.join(",") || undefined,
    orphan: orphan.value ? "true" : undefined,
    multiScenario: multiScenario.value ? "true" : undefined,
    sort: sort.value === "name" ? undefined : sort.value,
    order: order.value === "asc" ? undefined : order.value,
    page: page.value === 1 ? undefined : String(page.value),
    pageSize: pageSize.value === 0 ? undefined : String(pageSize.value),
    view: viewMode.value === "grid" ? undefined : viewMode.value,
  };
}
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [response, sourceResponse, scenarioResponse] = await Promise.all([
      catalogApi.skills(queryValues()),
      allCatalogApi.sources(),
      allCatalogApi.scenarios(),
    ]);
    items.value = response.data;
    total.value = response.meta.total;
    sources.value = sourceResponse;
    scenarios.value = scenarioResponse;
  } catch (reason) {
    error.value =
      reason instanceof Error ? reason.message : t("skills.errorFallback");
  } finally {
    loading.value = false;
  }
}
async function apply() {
  page.value = 1;
  await router.replace({ query: queryValues() });
  await load();
}
async function changePage(next: number) {
  page.value = next;
  await router.replace({ query: queryValues() });
  await load();
}
async function changePageSize(next: number | string) {
  pageSize.value = Number(next);
  await apply();
}
async function changeOrphan(): Promise<void> {
  if (orphan.value) multiScenario.value = false;
  await apply();
}
async function changeMultiScenario(): Promise<void> {
  if (multiScenario.value) orphan.value = false;
  await apply();
}
async function syncRoute(): Promise<void> {
  await router.replace({ query: queryValues() });
}
function formatTime(value: number | null): string {
  if (!value) return t("common.placeholder");
  return new Intl.DateTimeFormat(locale.value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}
async function clear() {
  q.value = "";
  sourceIds.value = [];
  scenarioIds.value = [];
  orphan.value = false;
  multiScenario.value = false;
  sort.value = "name";
  order.value = "asc";
  await apply();
}
onMounted(load);
</script>

<template>
  <section class="page">
    <p class="eyebrow">{{ t("skills.eyebrow") }}</p>
    <div class="title-row">
      <div>
        <h1>{{ t("skills.title") }}</h1>
        <p class="lead">{{ t("skills.lead", { count: total }) }}</p>
      </div>
      <a-button
        v-if="
          q || sourceIds.length || scenarioIds.length || orphan || multiScenario
        "
        @click="clear"
        >{{ t("common.clear") }}</a-button
      >
    </div>
    <div class="filters">
      <a-input-search
        v-model:value="q"
        allow-clear
        :placeholder="t('skills.searchPlaceholder')"
        @search="apply"
      /><a-select
        v-model:value="sourceIds"
        mode="multiple"
        allow-clear
        max-tag-count="responsive"
        :placeholder="t('skills.filters.sources')"
        @change="apply"
        ><a-select-option
          v-for="source in sources"
          :key="source.id"
          :value="source.id"
          >{{ source.name }}</a-select-option
        ></a-select
      ><a-select
        v-model:value="scenarioIds"
        mode="multiple"
        allow-clear
        max-tag-count="responsive"
        :placeholder="t('skills.filters.scenarios')"
        @change="apply"
        ><a-select-option
          v-for="scenario in scenarios"
          :key="scenario.id"
          :value="scenario.id"
          >{{ scenario.name }}</a-select-option
        ></a-select
      ><a-select
        v-model:value="sort"
        :aria-label="t('skills.sortAria')"
        @change="apply"
        ><a-select-option value="name">{{
          t("skills.sortOptions.name")
        }}</a-select-option
        ><a-select-option value="createdAt">{{
          t("skills.sortOptions.createdAt")
        }}</a-select-option
        ><a-select-option value="updatedAt">{{
          t("skills.sortOptions.updatedAt")
        }}</a-select-option
        ><a-select-option value="status">{{
          t("skills.sortOptions.status")
        }}</a-select-option></a-select
      ><a-select
        v-model:value="order"
        :aria-label="t('skills.orderAria')"
        @change="apply"
        ><a-select-option value="asc">{{
          t("skills.orderOptions.asc")
        }}</a-select-option
        ><a-select-option value="desc">{{
          t("skills.orderOptions.desc")
        }}</a-select-option></a-select
      ><a-checkbox v-model:checked="orphan" @change="changeOrphan">{{
        t("skills.checkboxes.orphanOnly")
      }}</a-checkbox
      ><a-checkbox
        v-model:checked="multiScenario"
        @change="changeMultiScenario"
        >{{ t("skills.checkboxes.multiScenarioOnly") }}</a-checkbox
      >
    </div>
    <div class="list-controls">
      <a-radio-group
        v-model:value="viewMode"
        :aria-label="t('skills.view.aria')"
        @change="syncRoute"
      >
        <a-radio-button value="grid">{{
          t("skills.view.grid")
        }}</a-radio-button>
        <a-radio-button value="table">{{
          t("skills.view.table")
        }}</a-radio-button>
      </a-radio-group>
      <label class="page-size-control"
        >{{ t("skills.pageSize.label") }}
        <a-select
          v-model:value="pageSize"
          :aria-label="t('skills.pageSize.aria')"
          @change="changePageSize"
          ><a-select-option :value="0">{{
            t("skills.pageSize.all")
          }}</a-select-option
          ><a-select-option :value="20">{{
            t("skills.pageSize.20")
          }}</a-select-option
          ><a-select-option :value="50">{{
            t("skills.pageSize.50")
          }}</a-select-option></a-select
        >
      </label>
    </div>
    <request-state
      :loading="loading"
      :error="error"
      :empty="items.length === 0"
      :empty-text="t('skills.emptyText')"
      @retry="load"
    >
      <div v-if="viewMode === 'grid'" class="skill-grid">
        <router-link
          v-for="skill in items"
          :key="skill.id"
          :to="{
            name: 'skill-detail',
            params: { skillId: skill.id },
            query: { from: route.fullPath },
          }"
          class="skill-card"
          ><div class="skill-head">
            <a-tag :color="skill.enabled ? 'green' : 'default'">{{
              skill.enabled
                ? t("skills.status.enabled")
                : t("skills.status.disabled")
            }}</a-tag
            ><span>{{ skill.source?.name || t("common.unknownSource") }}</span>
          </div>
          <h2>{{ skill.name }}</h2>
          <p>{{ skill.description || t("common.noDescription") }}</p>
          <small class="skill-created-at"
            >{{ t("common.createdAtPrefix") }}
            {{ formatTime(skill.createdAt) }}</small
          >
          <div class="scenario-tags">
            <a-tag v-for="scenario in skill.scenarios" :key="scenario.id">{{
              scenario.name
            }}</a-tag
            ><span v-if="skill.scenarios.length === 0" class="orphan">{{
              t("skills.orphanBadge")
            }}</span>
          </div></router-link
        >
      </div>
      <div v-else class="skill-table-wrap">
        <table class="skill-table" :aria-label="t('skills.title')">
          <thead>
            <tr>
              <th scope="col">{{ t("skills.tableHeaders.skill") }}</th>
              <th scope="col">{{ t("skills.tableHeaders.source") }}</th>
              <th scope="col">{{ t("skills.tableHeaders.scenarios") }}</th>
              <th scope="col">{{ t("skills.tableHeaders.status") }}</th>
              <th scope="col">{{ t("skills.tableHeaders.createdAt") }}</th>
              <th scope="col">{{ t("skills.tableHeaders.updatedAt") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="skill in items" :key="skill.id">
              <td>
                <router-link
                  :to="{
                    name: 'skill-detail',
                    params: { skillId: skill.id },
                    query: { from: route.fullPath },
                  }"
                  class="skill-name"
                  >{{ skill.name }}</router-link
                >
                <p>{{ skill.description || t("common.noDescription") }}</p>
              </td>
              <td>{{ skill.source?.name || t("common.unknownSource") }}</td>
              <td>
                <div class="scenario-tags table-scenarios">
                  <a-tag
                    v-for="scenario in skill.scenarios"
                    :key="scenario.id"
                    >{{ scenario.name }}</a-tag
                  >
                  <span v-if="skill.scenarios.length === 0" class="orphan">{{
                    t("skills.orphanBadge")
                  }}</span>
                </div>
              </td>
              <td>
                <a-tag :color="skill.enabled ? 'green' : 'default'">{{
                  skill.enabled
                    ? t("skills.status.enabled")
                    : t("skills.status.disabled")
                }}</a-tag>
              </td>
              <td>{{ formatTime(skill.createdAt) }}</td>
              <td>{{ formatTime(skill.updatedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <a-pagination
        v-if="pageSize > 0 && total > pageSize"
        :current="page"
        :page-size="pageSize"
        :total="total"
        :show-size-changer="false"
        @change="changePage"
      />
    </request-state>
  </section>
</template>

<style scoped>
.page {
  max-width: none;
}
.eyebrow {
  margin: 0 0 10px;
  color: #648078;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}
.title-row {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
}
h1 {
  margin: 0;
  font-family: Georgia, "Songti SC", serif;
  font-size: clamp(46px, 7vw, 76px);
  font-weight: 600;
  letter-spacing: -0.05em;
}
.lead {
  margin: 12px 0 34px;
  color: #657871;
  font-size: 16px;
}
.filters {
  display: grid;
  grid-template-columns: minmax(220px, 1.5fr) 1fr 1fr 150px 110px auto auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 28px;
}
.list-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: -10px 0 24px;
}
.page-size-control {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #657871;
  font-size: 13px;
}
.page-size-control :deep(.ant-select) {
  min-width: 120px;
}
.skill-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 28px;
}
@container (min-width: 1120px) {
  .skill-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
.skill-card {
  display: flex;
  min-width: 0;
  min-height: 240px;
  flex-direction: column;
  padding: 22px;
  border: 1px solid rgb(25 52 45 / 13%);
  border-radius: 18px;
  background: #fffdf7;
  text-decoration: none;
}
.skill-card:hover {
  border-color: #6b9586;
  box-shadow: 0 16px 36px rgb(32 56 48 / 8%);
}
.skill-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #71837c;
  font-size: 12px;
}
.skill-head > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.skill-card h2 {
  margin: 24px 0 10px;
  font-size: 21px;
}
.skill-card p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: #687a74;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
.skill-created-at {
  margin-top: 14px;
  color: #71837c;
  font-size: 12px;
}
.scenario-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: auto;
  padding-top: 20px;
}
.orphan {
  color: #a25f35;
  font-size: 12px;
}
.skill-table-wrap {
  overflow-x: auto;
  margin-bottom: 28px;
  border: 1px solid rgb(25 52 45 / 13%);
  border-radius: 14px;
  background: #fffdf7;
}
.skill-table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
  text-align: left;
}
.skill-table th,
.skill-table td {
  padding: 14px 16px;
  border-bottom: 1px solid rgb(25 52 45 / 10%);
  vertical-align: top;
}
.skill-table th {
  color: #58736a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.skill-table tbody tr:last-child td {
  border-bottom: 0;
}
.skill-table td {
  color: #526860;
  font-size: 13px;
}
.skill-table td:first-child {
  min-width: 240px;
}
.skill-name {
  color: #244f42;
  font-size: 15px;
  font-weight: 700;
}
.skill-table p {
  display: -webkit-box;
  overflow: hidden;
  margin: 5px 0 0;
  color: #71837c;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.table-scenarios {
  margin: 0;
  padding: 0;
}
@container (max-width: 900px) {
  .skill-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@container (max-width: 680px) {
  .list-controls {
    align-items: stretch;
    flex-direction: column;
  }
  .page-size-control {
    justify-content: space-between;
  }
  .filters,
  .skill-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .filters {
    grid-template-columns: 1fr;
  }
}
@container (max-width: 450px) {
  .skill-grid {
    grid-template-columns: 1fr;
  }
  .skill-card {
    min-height: 210px;
  }
}
</style>
