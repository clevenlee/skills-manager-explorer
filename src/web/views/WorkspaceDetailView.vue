<!--
  工作区详情：列出该工作区已启用的 Skill 与所属场景，tabs 切换。
  1.0.4 引入。
 * 作者：NDP Coding
 * 日期：2026-07-18 10:00:00
-->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import type { Scenario, SkillSummary } from "@/shared/contracts/catalog";
import { catalogApi } from "../api/catalog-api";
import RequestState from "../components/RequestState.vue";
import SkillListView from "../components/SkillListView.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const tab = ref<"skills" | "scenarios">("skills");
const skills = ref<SkillSummary[]>([]);
const scenarios = ref<Scenario[]>([]);
const loading = ref(true);
const error = ref("");

const name = computed(() => {
  const raw = route.params.name;
  return typeof raw === "string"
    ? raw
    : Array.isArray(raw)
      ? (raw[0] ?? "")
      : "";
});

async function load(): Promise<void> {
  if (!name.value) return;
  loading.value = true;
  error.value = "";
  try {
    const [skillsRes, scenariosRes] = await Promise.all([
      catalogApi.workspaceSkills(name.value),
      catalogApi.workspaceScenarios(name.value),
    ]);
    skills.value = skillsRes.data;
    scenarios.value = scenariosRes.data;
  } catch (reason) {
    error.value =
      reason instanceof Error ? reason.message : t("workspaces.errorFallback");
  } finally {
    loading.value = false;
  }
}

function back(): void {
  void router.push("/workspaces");
}

watch(name, load, { immediate: false });
onMounted(load);
</script>

<template>
  <section class="page">
    <button class="back" type="button" @click="back">
      {{ t("workspaces.backToList") }}
    </button>
    <p class="eyebrow">{{ t("workspaces.eyebrow") }}</p>
    <h1>{{ name }}</h1>
    <request-state :loading="loading" :error="error" @retry="load">
      <div class="tabs">
        <button
          type="button"
          :class="['tab', { active: tab === 'skills' }]"
          data-testid="workspace-tab-skills"
          @click="tab = 'skills'"
        >
          {{ t("workspaces.tabs.skills") }} ({{ skills.length }})
        </button>
        <button
          type="button"
          :class="['tab', { active: tab === 'scenarios' }]"
          data-testid="workspace-tab-scenarios"
          @click="tab = 'scenarios'"
        >
          {{ t("workspaces.tabs.scenarios") }} ({{ scenarios.length }})
        </button>
      </div>

      <div v-if="tab === 'skills'" data-testid="workspace-skills">
        <p
          v-if="skills.length === 0"
          class="empty"
          data-testid="workspace-empty-skills"
        >
          {{ t("workspaces.emptySkills") }}
        </p>
        <SkillListView
          v-else
          :items="skills"
          :from="route.fullPath"
          :empty-text="t('workspaces.emptySkills')"
          testid="workspace-skills"
        />
      </div>

      <div v-else data-testid="workspace-scenarios">
        <p
          v-if="scenarios.length === 0"
          class="empty"
          data-testid="workspace-empty-scenarios"
        >
          {{ t("workspaces.emptyScenarios") }}
        </p>
        <div v-else class="scenario-list">
          <router-link
            v-for="scenario in scenarios"
            :key="scenario.id"
            :to="{
              name: 'scenario-detail',
              params: { scenarioId: scenario.id },
              query: { from: route.fullPath },
            }"
            class="scenario-row"
          >
            <strong>{{ scenario.name }}</strong>
            <small
              >{{ t("scenarios.skillsCountSuffix") }}
              {{ scenario.skillCount }}</small
            >
          </router-link>
        </div>
      </div>
    </request-state>
  </section>
</template>

<style scoped src="../styles/views/workspace-detail.css"></style>
