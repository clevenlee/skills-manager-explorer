<!--
  来源清单与详情页面，支持搜索、排序、分页、安全外链及过滤后的 Skill 下钻。
  搜索占位、排序选项、空态、详情页文案经 useI18n() 国际化。
  作者：NDP Coding
  日期：2026-07-17 12:35:00
-->
<script setup lang="ts">
import { message } from "ant-design-vue";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import type { SkillSummary, Source } from "@/shared/contracts/catalog";
import { allCatalogApi, catalogApi } from "../api/catalog-api";
import RequestState from "../components/RequestState.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const items = ref<Source[]>([]);
const skills = ref<SkillSummary[]>([]);
const total = ref(0);
const loading = ref(true);
const error = ref("");
const q = ref(String(route.query.q || ""));
const sort = ref(String(route.query.sort || "name"));
const page = ref(Number(route.query.page || 1));
const sourceId = computed(() =>
  typeof route.params.sourceId === "string" ? route.params.sourceId : "",
);
const detail = computed(() =>
  items.value.find((item) => item.id === sourceId.value),
);
async function load() {
  loading.value = true;
  error.value = "";
  try {
    if (sourceId.value) {
      items.value = await allCatalogApi.sources();
      const skillResponse = await catalogApi.skills({
        sourceIds: sourceId.value,
        pageSize: 100,
      });
      skills.value = skillResponse.data;
      total.value = skillResponse.meta.total;
    } else {
      const response = await catalogApi.sources({
        q: q.value,
        sort: sort.value,
        page: page.value,
        pageSize: 12,
      });
      items.value = response.data;
      total.value = response.meta.total;
    }
  } catch (reason) {
    error.value =
      reason instanceof Error
        ? reason.message
        : t("sources.errorFallback", "无法加载来源。");
  } finally {
    loading.value = false;
  }
}
async function apply() {
  page.value = 1;
  await router.replace({
    query: {
      q: q.value || undefined,
      sort: sort.value === "name" ? undefined : sort.value,
    },
  });
  await load();
}
async function changePage(next: number) {
  page.value = next;
  await router.replace({
    query: { ...route.query, page: next === 1 ? undefined : String(next) },
  });
  await load();
}
watch(sourceId, load);
onMounted(load);
async function copyUrl(url: string): Promise<void> {
  await navigator.clipboard.writeText(url);
  void message.success(t("common.copySuccess"));
}
</script>

<template>
  <section class="page">
    <template v-if="sourceId"
      ><router-link class="back" to="/sources">{{
        t("sources.backToSources")
      }}</router-link>
      <p class="eyebrow">{{ t("sources.eyebrowDetail") }}</p>
      <div class="title-row">
        <h1>{{ detail?.name || t("sources.titleDetailFallback") }}</h1>
        <a
          v-if="detail?.externalUrl"
          class="external-link"
          :href="detail.externalUrl"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="t('sources.externalLink')"
          >↗</a
        >
      </div>
      <p class="lead">
        {{ t("sources.leadDetail", { count: total }) }}
      </p>
      <section
        v-if="detail?.externalUrl"
        class="source-url"
        :aria-label="t('sources.urlLabel')"
      >
        <span class="url-label">{{ t("sources.urlLabel") }}</span>
        <a
          class="url-value"
          :href="detail.externalUrl"
          target="_blank"
          rel="noopener noreferrer"
          >{{ detail.externalUrl }}</a
        >
        <a-button
          type="text"
          size="small"
          :aria-label="t('common.copy')"
          @click="copyUrl(detail.externalUrl!)"
          >{{ t("common.copy") }}</a-button
        >
      </section></template
    >
    <template v-else
      ><p class="eyebrow">{{ t("sources.eyebrowList") }}</p>
      <h1>{{ t("sources.title") }}</h1>
      <p class="lead">{{ t("sources.lead") }}</p>
      <div class="toolbar">
        <a-input-search
          v-model:value="q"
          allow-clear
          :placeholder="t('sources.searchPlaceholder')"
          @search="apply"
        /><a-select
          v-model:value="sort"
          :aria-label="t('sources.sortAria')"
          @change="apply"
          ><a-select-option value="name">{{
            t("sources.sortOptions.name")
          }}</a-select-option
          ><a-select-option value="skillCount">{{
            t("sources.sortOptions.skillCount")
          }}</a-select-option></a-select
        >
      </div>
    </template>
    <request-state
      :loading="loading"
      :error="error"
      :empty="sourceId ? skills.length === 0 : items.length === 0"
      :empty-text="t('sources.emptyText')"
      @retry="load"
    >
      <div v-if="sourceId" class="skill-list">
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
          ><span>{{ skill.description || t("common.noDescription") }}</span
          ><small>{{
            skill.scenarios.length
              ? skill.scenarios.map((s) => s.name).join(" · ")
              : t("common.unassigned")
          }}</small></router-link
        >
      </div>
      <div v-else class="source-grid">
        <article v-for="source in items" :key="source.id" class="source-card">
          <div class="source-top">
            <a-tag>{{ source.type }}</a-tag
            ><a
              v-if="source.externalUrl"
              :href="source.externalUrl"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="t('sources.externalLink')"
              >↗</a
            >
          </div>
          <h2>
            <router-link :to="`/sources/${source.id}`">{{
              source.name
            }}</router-link>
          </h2>
          <p class="source-key">{{ source.key }}</p>
          <div class="counts">
            <span
              ><strong>{{ source.skillCount }}</strong>
              {{ t("nav.skills") }}</span
            ><span
              ><strong>{{ source.orphanSkillCount }}</strong>
              {{ t("common.unassigned") }}</span
            >
          </div>
        </article>
      </div>
      <a-pagination
        v-if="!sourceId && total > 12"
        :current="page"
        :page-size="12"
        :total="total"
        :show-size-changer="false"
        @change="changePage"
      />
    </request-state>
  </section>
</template>

<style scoped src="../styles/views/sources.css"></style>
