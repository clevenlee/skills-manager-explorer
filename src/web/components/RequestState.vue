<!--
  统一请求状态组件，提供加载、错误重试和空结果反馈，业务内容通过默认插槽呈现。
  作者：NDP Coding
  日期：2026-07-17 12:20:00
-->
<script setup lang="ts">
defineProps<{
  loading: boolean;
  error?: string;
  empty?: boolean;
  emptyText?: string;
}>();
defineEmits<{ retry: [] }>();
</script>

<template>
  <a-skeleton v-if="loading" active :paragraph="{ rows: 5 }" />
  <a-result
    v-else-if="error"
    status="error"
    title="加载失败"
    :sub-title="error"
  >
    <template #extra
      ><a-button type="primary" @click="$emit('retry')"
        >重新尝试</a-button
      ></template
    >
  </a-result>
  <a-empty v-else-if="empty" :description="emptyText || '暂时没有数据'" />
  <slot v-else />
</template>
