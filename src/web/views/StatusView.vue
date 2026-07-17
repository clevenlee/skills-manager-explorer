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

<style scoped>
.status-view {
  max-width: 880px;
}
.eyebrow {
  margin: 0 0 12px;
  color: #648078;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}
h1 {
  margin: 0 0 42px;
  font-family: Georgia, "Songti SC", serif;
  font-size: clamp(38px, 7vw, 68px);
  font-weight: 600;
  letter-spacing: -0.04em;
}
.status-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 24px;
  padding: clamp(24px, 5vw, 48px);
  border: 1px solid rgb(25 52 45 / 14%);
  border-radius: 24px;
  background: rgb(255 253 247 / 92%);
  box-shadow: 0 24px 60px rgb(32 56 48 / 8%);
}
.state-icon {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  border-radius: 18px;
  color: #fff;
  background: #b77736;
  font-size: 24px;
  font-weight: 700;
}
.state-icon.ready {
  background: #2f765b;
}
.file-label {
  margin: 2px 0 8px;
  color: #70837d;
  font-family: ui-monospace, monospace;
  font-size: 13px;
}
h2 {
  margin: 0;
  color: #19342d;
  font-size: clamp(24px, 4vw, 34px);
}
.state-copy,
.issues {
  margin: 14px 0 0;
  color: #61736d;
  line-height: 1.7;
}
.issues {
  padding-left: 20px;
}
.retry {
  margin-top: 24px;
}
@media (max-width: 520px) {
  .status-card {
    grid-template-columns: 1fr;
  }
}
</style>
