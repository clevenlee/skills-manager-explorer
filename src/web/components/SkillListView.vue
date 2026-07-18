<!--
  共享 Skill 展示清单：在 Source / Scenario / Workspace / Analysis 详情中复用。
  字段：名称（点击进 Skill 详情）、来源、场景归属、状态、创建/更新时间。
  作者：NDP Coding
 * 日期：2026-07-18 09:30:00
-->
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import type { SkillSummary } from "@/shared/contracts/catalog";

const props = defineProps<{
  items: SkillSummary[];
  from?: string;
  emptyText?: string;
  testid?: string;
}>();

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

const fromQuery = computed(() => props.from ?? route.fullPath);
const emptyText = computed(() => props.emptyText ?? t("common.emptyFallback"));

function go(skill: SkillSummary) {
  void router.push({
    name: "skill-detail",
    params: { skillId: skill.id },
    query: { from: fromQuery.value },
  });
}

function formatTime(value: number | null) {
  if (!value) return t("common.placeholder");
  return new Intl.DateTimeFormat(locale.value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
</script>

<template>
  <div
    v-if="items.length === 0"
    class="skill-list-empty"
    :data-testid="testid ? `${testid}-empty` : 'skill-list-empty'"
  >
    {{ emptyText }}
  </div>
  <ul v-else class="skill-list-grid" :data-testid="testid">
    <li v-for="skill in items" :key="skill.id" class="skill-list-item">
      <button
        type="button"
        class="skill-list-button"
        :data-testid="`skill-list-item-${skill.id}`"
        @click="go(skill)"
      >
        <div class="skill-list-row skill-list-row-main">
          <span class="skill-list-name">{{ skill.name }}</span>
          <span class="skill-list-source">
            {{ skill.source?.name || t("common.unknownSource") }}
          </span>
          <span
            :class="[
              'skill-list-status',
              skill.enabled ? 'enabled' : 'disabled',
            ]"
          >
            {{
              skill.enabled
                ? t("skills.status.enabled")
                : t("skills.status.disabled")
            }}
          </span>
        </div>
        <div class="skill-list-row skill-list-row-meta">
          <span v-if="skill.description" class="skill-list-description">
            {{ skill.description }}
          </span>
          <ul
            class="skill-list-scenarios"
            :aria-label="t('skills.tableHeaders.scenarios')"
          >
            <li v-for="sc in skill.scenarios" :key="sc.id">
              {{ sc.name }}
            </li>
            <li v-if="skill.scenarios.length === 0" class="orphan">
              {{ t("skills.orphanBadge") }}
            </li>
          </ul>
        </div>
        <div class="skill-list-row skill-list-row-time">
          <span class="skill-list-time">
            <span class="label">{{ t("skillDetail.fields.createdAt") }}</span>
            <span class="value">{{ formatTime(skill.createdAt) }}</span>
          </span>
          <span class="skill-list-time">
            <span class="label">{{ t("skillDetail.fields.updatedAt") }}</span>
            <span class="value">{{ formatTime(skill.updatedAt) }}</span>
          </span>
        </div>
      </button>
    </li>
  </ul>
</template>

<style scoped src="../styles/components/skill-list-view.css"></style>
