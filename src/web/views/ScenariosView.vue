<!--
  场景清单与详情页面，只读展示业务场景、稳定顺序和其中的 Skill。
  作者：NDP Coding
  日期：2026-07-17 12:35:00
-->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import type { Scenario, SkillSummary } from "@/shared/contracts/catalog";
import { allCatalogApi, catalogApi } from "../api/catalog-api";
import RequestState from "../components/RequestState.vue";

const route = useRoute();
const router = useRouter();
const items = ref<Scenario[]>([]);
const skills = ref<SkillSummary[]>([]);
const total = ref(0);
const loading = ref(true);
const error = ref("");
const q = ref(String(route.query.q || ""));
const page = ref(Number(route.query.page || 1));
const scenarioId = computed(() =>
  typeof route.params.scenarioId === "string" ? route.params.scenarioId : "",
);
const detail = computed(() =>
  items.value.find((item) => item.id === scenarioId.value),
);
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const response = scenarioId.value
      ? { data: await allCatalogApi.scenarios(), meta: { total: 0 } }
      : await catalogApi.scenarios({
          q: q.value,
          page: page.value,
          pageSize: 12,
        });
    items.value = response.data;
    total.value = scenarioId.value ? response.data.length : response.meta.total;
    if (scenarioId.value)
      skills.value = (
        await catalogApi.skills({
          scenarioIds: scenarioId.value,
          pageSize: 100,
        })
      ).data;
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "无法加载场景。";
  } finally {
    loading.value = false;
  }
}
async function search() {
  page.value = 1;
  await router.replace({ query: { q: q.value || undefined } });
  await load();
}
async function changePage(next: number) {
  page.value = next;
  await router.replace({
    query: { ...route.query, page: next === 1 ? undefined : String(next) },
  });
  await load();
}
watch(scenarioId, load);
onMounted(load);
</script>

<template>
  <section class="page">
    <template v-if="scenarioId"
      ><router-link class="back" to="/scenarios">← 返回场景</router-link>
      <p class="eyebrow">SCENARIO DETAIL</p>
      <h1>{{ detail?.name || "场景详情" }}</h1>
      <p class="lead">{{ detail?.description || "暂无描述" }}</p></template
    >
    <template v-else
      ><p class="eyebrow">WORK CONTEXTS</p>
      <h1>场景</h1>
      <p class="lead">
        场景由 Skills Manager 维护；这里专注于查看覆盖，而不是新增或修改场景。
      </p>
      <a-input-search
        v-model:value="q"
        class="search"
        allow-clear
        placeholder="搜索场景"
        @search="search"
    /></template>
    <request-state
      :loading="loading"
      :error="error"
      :empty="scenarioId ? skills.length === 0 : items.length === 0"
      empty-text="没有匹配的场景"
      @retry="load"
    >
      <div v-if="scenarioId" class="skill-list">
        <router-link
          v-for="skill in skills"
          :key="skill.id"
          :to="{
            name: 'skill-detail',
            params: { skillId: skill.id },
            query: { from: route.fullPath },
          }"
          class="skill-row"
          ><strong>{{ skill.name }}</strong
          ><span>{{ skill.description || "暂无描述" }}</span></router-link
        >
      </div>
      <div v-else class="scenario-grid">
        <router-link
          v-for="scenario in items"
          :key="scenario.id"
          :to="`/scenarios/${scenario.id}`"
          class="scenario-card"
          ><span class="order">{{
            String(scenario.sortOrder).padStart(2, "0")
          }}</span>
          <div>
            <h2>{{ scenario.name }}</h2>
            <p>{{ scenario.description || "暂无描述" }}</p>
          </div>
          <strong
            >{{ scenario.skillCount }}<small> Skills</small></strong
          ></router-link
        >
      </div>
      <a-pagination
        v-if="!scenarioId && total > 12"
        :current="page"
        :page-size="12"
        :total="total"
        :show-size-changer="false"
        @change="changePage"
      />
    </request-state>
  </section>
</template>

<style scoped>
.page {
  max-width: 1000px;
}
.back {
  display: inline-block;
  margin-bottom: 30px;
  color: #58736a;
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
  max-width: 680px;
  margin: 18px 0 36px;
  color: #657871;
  font-size: 17px;
  line-height: 1.7;
}
.search {
  max-width: 480px;
  margin-bottom: 30px;
}
.scenario-grid,
.skill-list {
  display: grid;
  gap: 12px;
  margin-bottom: 28px;
}
.scenario-card {
  display: grid;
  grid-template-columns: 54px 1fr auto;
  gap: 20px;
  align-items: center;
  padding: 24px;
  border: 1px solid rgb(25 52 45 / 13%);
  border-radius: 18px;
  background: #fffdf7;
  text-decoration: none;
}
.scenario-card:hover {
  border-color: #6b9586;
}
.order {
  color: #8a9a94;
  font-family: Georgia, serif;
  font-size: 24px;
}
.scenario-card h2 {
  margin: 0 0 5px;
  font-size: 22px;
}
.scenario-card p {
  margin: 0;
  color: #687a74;
}
.scenario-card > strong {
  font-family: Georgia, serif;
  font-size: 30px;
}
.scenario-card small {
  color: #70837d;
  font-family: inherit;
  font-size: 11px;
}
.skill-row {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 18px;
  padding: 18px 20px;
  border: 1px solid rgb(25 52 45 / 12%);
  border-radius: 14px;
  background: #fffdf7;
  text-decoration: none;
}
.skill-row span {
  color: #687a74;
}
@media (max-width: 560px) {
  .scenario-card {
    grid-template-columns: 38px 1fr;
  }
  .scenario-card > strong {
    grid-column: 2;
    font-size: 20px;
  }
  .skill-row {
    grid-template-columns: 1fr;
  }
}
</style>
