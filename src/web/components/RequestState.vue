<!--
  统一请求状态组件，提供加载、错误重试和空结果反馈，业务内容通过默认插槽呈现。
  错误标题 / 重试按钮 / 默认空态文案经 useI18n() 国际化。
  作者：NDP Coding
  日期：2026-07-17 12:20:00
-->
<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  loading: boolean;
  error?: string;
  empty?: boolean;
  emptyText?: string;
}>();
defineEmits<{ retry: [] }>();

const { t } = useI18n();
</script>

<template>
  <a-skeleton v-if="loading" active :paragraph="{ rows: 5 }" />
  <a-result
    v-else-if="error"
    status="error"
    :title="t('common.error')"
    :sub-title="error"
  >
    <template #extra
      ><a-button type="primary" @click="$emit('retry')">{{
        t("common.retry")
      }}</a-button></template
    >
  </a-result>
  <a-empty
    v-else-if="empty"
    :description="emptyText || t('common.emptyFallback')"
  />
  <slot v-else />
</template>
