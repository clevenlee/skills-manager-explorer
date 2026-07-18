<!--
  概览页面，以可跳转指标呈现 Skill、来源、场景与孤立 Skill 总量。
  卡片标签、副标题、错误兜底文案经 useI18n() 国际化。
  作者：NDP Coding
  日期：2026-07-17 12:20:00
-->
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { z } from "zod";

import type { overviewEnvelopeSchema } from "@/shared/contracts/catalog";
import { catalogApi } from "../api/catalog-api";
import RequestState from "../components/RequestState.vue";

type Overview = z.infer<typeof overviewEnvelopeSchema>["data"];
const { t } = useI18n();
const data = ref<Overview>();
const loading = ref(true);
const error = ref("");
async function load() {
  loading.value = true;
  error.value = "";
  try {
    data.value = (await catalogApi.overview()).data;
  } catch (reason) {
    error.value =
      reason instanceof Error ? reason.message : t("overview.errorFallback");
  } finally {
    loading.value = false;
  }
}
onMounted(load);
const cards = () => [
  {
    label: t("overview.cards.skills.label"),
    value: data.value?.skills ?? 0,
    to: "/skills",
    note: t("overview.cards.skills.note"),
  },
  {
    label: t("overview.cards.sources.label"),
    value: data.value?.sources ?? 0,
    to: "/sources",
    note: t("overview.cards.sources.note"),
  },
  {
    label: t("overview.cards.scenarios.label"),
    value: data.value?.scenarios ?? 0,
    to: "/scenarios",
    note: t("overview.cards.scenarios.note"),
  },
  {
    label: t("overview.cards.orphan.label"),
    value: data.value?.orphanSkills ?? 0,
    to: "/skills?orphan=true",
    note: t("overview.cards.orphan.note"),
    accent: true,
  },
  {
    label: t("overview.cards.multiScenario.label"),
    value: data.value?.multiScenarioSkills ?? 0,
    to: "/skills?multiScenario=true",
    note: t("overview.cards.multiScenario.note"),
    accent: true,
  },
];
</script>

<template>
  <section class="page">
    <p class="eyebrow">{{ t("overview.eyebrow") }}</p>
    <h1>{{ t("overview.title") }}</h1>
    <p class="lead">{{ t("overview.lead") }}</p>
    <request-state :loading="loading" :error="error" @retry="load">
      <div class="metric-grid">
        <router-link
          v-for="card in cards()"
          :key="card.label"
          :to="card.to"
          :class="['metric-card', { accent: card.accent }]"
        >
          <span>{{ card.label }}</span
          ><strong>{{ card.value }}</strong
          ><small>{{ card.note }} →</small>
        </router-link>
      </div>
    </request-state>
  </section>
</template>

<style scoped src="../styles/views/overview.css"></style>
