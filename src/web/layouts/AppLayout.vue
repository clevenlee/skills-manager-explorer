<!--
  应用主布局，提供可收起的桌面侧栏与窄屏抽屉导航，并持续显示本地只读优先边界。
  导航文案与 aria-label 经 useI18n() 国际化；桌面侧栏底部自上而下：收起 → 语言 → 数据库状态。
  作者：NDP Coding
  日期：2026-07-17 10:55:00
-->
<script setup lang="ts">
import {
  ApartmentOutlined,
  AppstoreOutlined,
  ClusterOutlined,
  DashboardOutlined,
  FolderOpenOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  SwapOutlined,
} from "@ant-design/icons-vue";
import { computed, h, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import skillsManagerIconUrl from "../assets/skills-manager-icon.png";
import LocaleSwitcher from "../components/LocaleSwitcher.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const drawerOpen = ref(false);
const sidebarCollapsed = ref(false);
const selectedKeys = computed(() => [
  route.path === "/" ? "/" : `/${route.path.split("/")[1]}`,
]);
const navItems = computed(() => [
  { key: "/", label: t("nav.overview"), icon: h(DashboardOutlined) },
  { key: "/sources", label: t("nav.sources"), icon: h(FolderOpenOutlined) },
  { key: "/scenarios", label: t("nav.scenarios"), icon: h(ApartmentOutlined) },
  { key: "/skills", label: t("nav.skills"), icon: h(AppstoreOutlined) },
  { key: "/workspaces", label: t("nav.workspaces"), icon: h(ClusterOutlined) },
  { key: "/compare", label: t("nav.compare"), icon: h(SwapOutlined) },
]);

async function navigate(key: string): Promise<void> {
  drawerOpen.value = false;
  await router.push(key);
}
</script>

<template>
  <div class="app-frame">
    <a class="skip-link" href="#main-content">{{
      t("common.skipToContent", "Skip to content")
    }}</a>
    <nav
      :class="['sidebar', { collapsed: sidebarCollapsed }]"
      :aria-label="t('nav.primary')"
      data-testid="sidebar"
    >
      <router-link class="brand" to="/" :aria-label="t('nav.home')">
        <img class="brand-icon" :src="skillsManagerIconUrl" alt="" />
      </router-link>
      <div class="sidebar-top">
        <span v-show="!sidebarCollapsed" class="brand-name"
          ><strong>Skills<br />Manager<br />Explorer</strong
          ><small>{{ t("app.description") }}</small></span
        >
      </div>
      <a-menu
        mode="inline"
        :items="navItems"
        :selected-keys="selectedKeys"
        :inline-collapsed="sidebarCollapsed"
        data-testid="nav-menu"
        @click="navigate(String($event.key))"
      />
      <div class="sidebar-footer">
        <a-button
          class="collapse-button"
          type="text"
          :aria-label="
            sidebarCollapsed
              ? t('common.expandNavigation')
              : t('common.collapseNavigation')
          "
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <menu-unfold-outlined v-if="sidebarCollapsed" />
          <menu-fold-outlined v-else />
        </a-button>
        <span class="sidebar-footer-divider" aria-hidden="true" />
        <LocaleSwitcher class="locale-switcher-slot" />
        <span class="sidebar-footer-divider" aria-hidden="true" />
        <router-link
          class="database-link"
          to="/status"
          :aria-label="t('nav.status')"
        >
          <span class="status-dot" aria-hidden="true" /><span
            v-show="!sidebarCollapsed"
            >{{ t("nav.status") }}</span
          >
        </router-link>
      </div>
    </nav>

    <header class="mobile-header">
      <a-button
        type="text"
        :aria-label="t('common.openNavigation')"
        @click="drawerOpen = true"
        ><menu-outlined
      /></a-button>
      <router-link class="mobile-brand" to="/">Skills Manager</router-link>
      <div class="mobile-actions">
        <LocaleSwitcher />
        <router-link
          class="mobile-status"
          to="/status"
          :aria-label="t('nav.status')"
          ><span class="status-dot"
        /></router-link>
      </div>
    </header>

    <a-drawer
      v-model:open="drawerOpen"
      placement="left"
      :width="280"
      :title="t('app.title')"
    >
      <a-menu
        mode="inline"
        :items="navItems"
        :selected-keys="selectedKeys"
        @click="navigate(String($event.key))"
      />
    </a-drawer>

    <main
      id="main-content"
      :class="['content', { 'sidebar-collapsed': sidebarCollapsed }]"
    >
      <router-view />
    </main>
  </div>
</template>

<style scoped src="../styles/layout.css"></style>
