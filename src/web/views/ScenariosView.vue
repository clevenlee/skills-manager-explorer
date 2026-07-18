<!--
  场景清单与详情页面，只读展示业务场景、稳定顺序和其中的 Skill。
  搜索占位、详情文案、空态经 useI18n() 国际化。
  作者：NDP Coding
  日期：2026-07-17 12:35:00
-->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import type { Scenario, SkillSummary } from "@/shared/contracts/catalog";
import { allCatalogApi, catalogApi } from "../api/catalog-api";
import { useLocale } from "../composables/useLocale";
import RequestState from "../components/RequestState.vue";

const { t } = useI18n();
const { formatNumber } = useLocale();
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
    error.value =
      reason instanceof Error
        ? reason.message
        : t("scenarios.errorFallback", "无法加载场景。");
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
      ><router-link class="back" to="/scenarios">{{
        t("scenarios.backToScenarios")
      }}</router-link>
      <p class="eyebrow">{{ t("scenarios.eyebrowDetail") }}</p>
      <h1>{{ detail?.name || t("scenarios.titleDetailFallback") }}</h1>
      <p class="lead">
        {{ detail?.description || t("common.noDescription") }}
      </p></template
    >
    <template v-else
      ><p class="eyebrow">{{ t("scenarios.eyebrowList") }}</p>
      <h1>{{ t("scenarios.title") }}</h1>
      <p class="lead">{{ t("scenarios.lead") }}</p>
      <a-input-search
        v-model:value="q"
        class="search"
        allow-clear
        :placeholder="t('scenarios.searchPlaceholder')"
        @search="search"
    /></template>
    <request-state
      :loading="loading"
      :error="error"
      :empty="scenarioId ? skills.length === 0 : items.length === 0"
      :empty-text="t('scenarios.emptyText')"
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
          ><span>{{
            skill.description || t("common.noDescription")
          }}</span></router-link
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
            <p>{{ scenario.description || t("common.noDescription") }}</p>
          </div>
          <strong
            >{{ formatNumber(scenario.skillCount)
            }}<small>{{ t("scenarios.skillsCountSuffix") }}</small></strong
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

<style scoped src="../styles/views/scenarios.css"></style>
