<!--
  数据库状态页面，区分加载、正常、缺失、不兼容、不可用与只读能力并提供重试。
  标题、副标题、刷新按钮、错误兜底文案经 useI18n() 国际化。
  作者：NDP Coding
  日期：2026-07-17 10:55:00
-->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { apiRequest } from "../api/api-client";
import {
  statusEnvelopeSchema,
  type StatusEnvelope,
} from "@/shared/contracts/status";

const { t } = useI18n();
const status = ref<StatusEnvelope>();
const error = ref("");
const loading = ref(true);
const database = computed(() => status.value?.data.database);
const title = computed(() => {
  if (!database.value) return t("status.page.connecting");
  if (database.value.state === "ready")
    return database.value.writable
      ? t("status.page.readyWritable")
      : t("status.page.readyReadOnly");
  if (database.value.state === "missing") return t("status.page.missing");
  if (database.value.state === "incompatible")
    return t("status.page.incompatible");
  return t("status.page.unknown");
});

async function loadStatus(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    status.value = await apiRequest("/api/v1/status", statusEnvelopeSchema);
  } catch (reason) {
    error.value =
      reason instanceof Error ? reason.message : t("status.errorFallback");
  } finally {
    loading.value = false;
  }
}

onMounted(loadStatus);
</script>

<template>
  <section class="status-view" aria-labelledby="status-title">
    <p class="eyebrow">{{ t("status.page.eyebrow") }}</p>
    <h1 id="status-title">{{ t("status.page.title") }}</h1>
    <a-skeleton v-if="loading" active :paragraph="{ rows: 4 }" />
    <a-result
      v-else-if="error"
      status="error"
      :title="t('status.errorTitle')"
      :sub-title="error"
    >
      <template #extra
        ><a-button type="primary" @click="loadStatus">{{
          t("common.retry")
        }}</a-button></template
      >
    </a-result>
    <article v-else class="status-card">
      <div :class="['state-icon', database?.state]" aria-hidden="true">
        {{ database?.state === "ready" ? "✓" : "!" }}
      </div>
      <div>
        <p class="file-label">{{ database?.label }}</p>
        <h2>{{ title }}</h2>
        <p
          v-if="database?.state === 'ready' && database.writable"
          class="state-copy"
        >
          {{ t("status.page.readyCopy") }}
        </p>
        <ul v-else-if="database?.issues.length" class="issues">
          <li v-for="issue in database.issues" :key="issue">{{ issue }}</li>
        </ul>
        <a-button class="retry" @click="loadStatus">{{
          t("common.refreshStatus")
        }}</a-button>
      </div>
    </article>
  </section>
</template>

<style scoped src="../styles/views/status.css"></style>
