<!--
  顶栏语言切换器：使用 a-dropdown 暴露 zh-CN / en-US 两项。
  当前语言以菜单项高亮呈现；切换经 useLocale.setLocale 同步持久化与 <html lang>。
  作者：NDP Coding
  日期：2026-07-18 09:30:00
-->
<script setup lang="ts">
import { computed } from "vue";

import { useLocale } from "../composables/useLocale";
import type { SupportedLocale } from "../i18n";

const { locale, supported, setLocale, t } = useLocale();

const current = computed(() => locale.value);

const items = computed(() =>
  supported.map((value) => ({
    key: value,
    label: value === "zh-CN" ? t("locale.chinese") : t("locale.english"),
  })),
);

function pick(value: SupportedLocale): void {
  setLocale(value);
}
</script>

<template>
  <a-dropdown :trigger="['click']" placement="bottomRight">
    <a-button
      type="text"
      :aria-label="t('locale.switchLabel')"
      class="locale-switcher"
    >
      {{ current === "zh-CN" ? "中" : "EN" }}
    </a-button>
    <template #overlay>
      <a-menu
        :selected-keys="[current]"
        @click="(e: { key: string }) => pick(e.key as SupportedLocale)"
      >
        <a-menu-item v-for="item in items" :key="item.key">
          {{ item.label }}
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<style scoped src="../styles/components/locale-switcher.css"></style>
