<!--
  概览页面，以可跳转指标呈现 Skill、来源、场景与孤立 Skill 总量。
  作者：NDP Coding
  日期：2026-07-17 12:20:00
-->
<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { z } from "zod";

import type { overviewEnvelopeSchema } from "@/shared/contracts/catalog";
import { catalogApi } from "../api/catalog-api";
import RequestState from "../components/RequestState.vue";

type Overview = z.infer<typeof overviewEnvelopeSchema>["data"];
const data = ref<Overview>();
const loading = ref(true);
const error = ref("");
async function load() {
  loading.value = true;
  error.value = "";
  try {
    data.value = (await catalogApi.overview()).data;
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "无法加载概览。";
  } finally {
    loading.value = false;
  }
}
onMounted(load);
const cards = () => [
  {
    label: "Skills",
    value: data.value?.skills ?? 0,
    to: "/skills",
    note: "已记录的能力单元",
  },
  {
    label: "来源",
    value: data.value?.sources ?? 0,
    to: "/sources",
    note: "归一化后的来源",
  },
  {
    label: "场景",
    value: data.value?.scenarios ?? 0,
    to: "/scenarios",
    note: "当前工作场景",
  },
  {
    label: "未归属",
    value: data.value?.orphanSkills ?? 0,
    to: "/skills?orphan=true",
    note: "需要关注的孤立 Skill",
    accent: true,
  },
  {
    label: "重复归属",
    value: data.value?.multiScenarioSkills ?? 0,
    to: "/skills?multiScenario=true",
    note: "需要关注的多场景归属 Skill",
    accent: true,
  },
];
</script>

<template>
  <section class="page">
    <p class="eyebrow">YOUR SKILLS LANDSCAPE</p>
    <h1>一眼看清<br />你的技能库</h1>
    <p class="lead">从来源与场景出发，找到能力覆盖中的重叠、差异和空白。</p>
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

<style scoped>
.page {
  max-width: 1100px;
}
.eyebrow {
  margin: 0 0 12px;
  color: #648078;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}
h1 {
  margin: 0;
  font-family: Georgia, "Songti SC", serif;
  font-size: clamp(48px, 8vw, 88px);
  font-weight: 600;
  letter-spacing: -0.055em;
  line-height: 1.02;
}
.lead {
  max-width: 600px;
  margin: 26px 0 52px;
  color: #63766f;
  font-size: 18px;
  line-height: 1.7;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}
.metric-card {
  display: flex;
  min-height: 210px;
  flex-direction: column;
  padding: 26px;
  border: 1px solid rgb(25 52 45 / 14%);
  border-radius: 22px;
  background: rgb(255 253 247 / 92%);
  text-decoration: none;
  transition: 0.2s ease;
}
.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 45px rgb(32 56 48 / 10%);
}
.metric-card strong {
  margin: auto 0;
  font-family: Georgia, serif;
  font-size: 58px;
  font-weight: 500;
}
.metric-card small {
  color: #6c7e78;
}
.metric-card.accent {
  color: #fff;
  background: #245c4c;
}
.metric-card.accent small {
  color: #d8e8df;
}
@media (max-width: 1000px) {
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 520px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
  .metric-card {
    min-height: 150px;
  }
  .metric-card strong {
    font-size: 46px;
  }
}
</style>
