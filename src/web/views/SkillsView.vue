<!--
  Skill 清单页面，把搜索、来源、场景、孤立状态、排序和分页完整保存在 URL。
  作者：NDP Coding
  日期：2026-07-17 12:50:00
-->
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import type {
  Scenario,
  SkillSummary,
  Source,
} from "@/shared/contracts/catalog";
import { allCatalogApi, catalogApi } from "../api/catalog-api";
import RequestState from "../components/RequestState.vue";

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
      reason instanceof Error ? reason.message : "无法加载 Skills。";
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
  return value ? new Date(value).toLocaleString("zh-CN") : "—";
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
    <p class="eyebrow">SKILL CATALOG</p>
    <div class="title-row">
      <div>
        <h1>Skills</h1>
        <p class="lead">{{ total }} 个能力单元，来自你的本地数据库。</p>
      </div>
      <a-button
        v-if="
          q || sourceIds.length || scenarioIds.length || orphan || multiScenario
        "
        @click="clear"
        >清空条件</a-button
      >
    </div>
    <div class="filters">
      <a-input-search
        v-model:value="q"
        allow-clear
        placeholder="搜索名称或描述"
        @search="apply"
      /><a-select
        v-model:value="sourceIds"
        mode="multiple"
        allow-clear
        max-tag-count="responsive"
        placeholder="来源"
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
        placeholder="场景"
        @change="apply"
        ><a-select-option
          v-for="scenario in scenarios"
          :key="scenario.id"
          :value="scenario.id"
          >{{ scenario.name }}</a-select-option
        ></a-select
      ><a-select v-model:value="sort" aria-label="Skill 排序" @change="apply"
        ><a-select-option value="name">按名称</a-select-option
        ><a-select-option value="createdAt">按创建时间</a-select-option
        ><a-select-option value="updatedAt">按更新时间</a-select-option
        ><a-select-option value="status">按状态</a-select-option></a-select
      ><a-select v-model:value="order" aria-label="排序方向" @change="apply"
        ><a-select-option value="asc">升序</a-select-option
        ><a-select-option value="desc">倒序</a-select-option></a-select
      ><a-checkbox v-model:checked="orphan" @change="changeOrphan"
        >仅未归属</a-checkbox
      ><a-checkbox v-model:checked="multiScenario" @change="changeMultiScenario"
        >仅重复归属</a-checkbox
      >
    </div>
    <div class="list-controls">
      <a-radio-group
        v-model:value="viewMode"
        aria-label="展示方式"
        @change="syncRoute"
      >
        <a-radio-button value="grid">块状</a-radio-button>
        <a-radio-button value="table">表格</a-radio-button>
      </a-radio-group>
      <label class="page-size-control"
        >每页数量
        <a-select
          v-model:value="pageSize"
          aria-label="每页数量"
          @change="changePageSize"
          ><a-select-option :value="0">不分页</a-select-option
          ><a-select-option :value="20">20 条/页</a-select-option
          ><a-select-option :value="50">50 条/页</a-select-option></a-select
        >
      </label>
    </div>
    <request-state
      :loading="loading"
      :error="error"
      :empty="items.length === 0"
      empty-text="没有匹配的 Skill"
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
              skill.enabled ? "启用" : "停用"
            }}</a-tag
            ><span>{{ skill.source?.name || "未知来源" }}</span>
          </div>
          <h2>{{ skill.name }}</h2>
          <p>{{ skill.description || "暂无描述" }}</p>
          <small class="skill-created-at"
            >创建于 {{ formatTime(skill.createdAt) }}</small
          >
          <div class="scenario-tags">
            <a-tag v-for="scenario in skill.scenarios" :key="scenario.id">{{
              scenario.name
            }}</a-tag
            ><span v-if="skill.scenarios.length === 0" class="orphan"
              >未归属任何场景</span
            >
          </div></router-link
        >
      </div>
      <div v-else class="skill-table-wrap">
        <table class="skill-table" aria-label="Skill 列表">
          <thead>
            <tr>
              <th scope="col">Skill</th>
              <th scope="col">来源</th>
              <th scope="col">场景归属</th>
              <th scope="col">状态</th>
              <th scope="col">创建时间</th>
              <th scope="col">更新时间</th>
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
                <p>{{ skill.description || "暂无描述" }}</p>
              </td>
              <td>{{ skill.source?.name || "未知来源" }}</td>
              <td>
                <div class="scenario-tags table-scenarios">
                  <a-tag
                    v-for="scenario in skill.scenarios"
                    :key="scenario.id"
                    >{{ scenario.name }}</a-tag
                  >
                  <span v-if="skill.scenarios.length === 0" class="orphan"
                    >未归属任何场景</span
                  >
                </div>
              </td>
              <td>
                <a-tag :color="skill.enabled ? 'green' : 'default'">{{
                  skill.enabled ? "启用" : "停用"
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
