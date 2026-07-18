<!--
  分析入口页：以卡片网格展示所有可用分析。卡片风格与工作区列表一致（顶部 1px 高光、hover 抬起）。
  1.0.6 引入。
  作者：NDP Coding
 * 日期：2026-07-18 09:30:00
-->
<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();
const router = useRouter();

const cards = [
  {
    id: "workspace-skill-mismatches",
    eyebrowKey: "analysis.workspaceMismatch.eyebrow",
    titleKey: "analysis.workspaceMismatch.title",
    descriptionKey: "analysis.workspaceMismatch.description",
    path: "/analysis/workspace-skill-mismatches",
  },
] as const;

function open(path: string): void {
  void router.push(path);
}
</script>

<template>
  <section class="page">
    <p class="eyebrow">{{ t("analysis.eyebrow") }}</p>
    <h1>{{ t("analysis.title") }}</h1>
    <p class="lead">{{ t("analysis.lead") }}</p>
    <div class="analysis-grid" data-testid="analysis-grid">
      <button
        v-for="card in cards"
        :key="card.id"
        type="button"
        class="analysis-card"
        :data-testid="`analysis-card-${card.id}`"
        @click="open(card.path)"
      >
        <span class="analysis-card-eyebrow">{{ t(card.eyebrowKey) }}</span>
        <h2 class="analysis-card-title">{{ t(card.titleKey) }}</h2>
        <p class="analysis-card-description">
          {{ t(card.descriptionKey) }}
        </p>
        <span class="analysis-card-cta">{{ t("analysis.openCta") }} →</span>
      </button>
    </div>
  </section>
</template>

<style scoped src="../styles/views/analysis.css"></style>
