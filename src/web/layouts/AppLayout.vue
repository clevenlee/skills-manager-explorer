<!--
  应用主布局，提供可收起的桌面侧栏与窄屏抽屉导航，并持续显示本地只读优先边界。
  作者：NDP Coding
  日期：2026-07-17 10:55:00
-->
<script setup lang="ts">
import {
  ApartmentOutlined,
  AppstoreOutlined,
  DashboardOutlined,
  FolderOpenOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  SwapOutlined,
} from "@ant-design/icons-vue";
import { computed, h, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import skillsManagerIconUrl from "../assets/skills-manager-icon.png";

const route = useRoute();
const router = useRouter();
const drawerOpen = ref(false);
const sidebarCollapsed = ref(false);
const selectedKeys = computed(() => [
  route.path === "/" ? "/" : `/${route.path.split("/")[1]}`,
]);
const navItems = [
  { key: "/", label: "概览", icon: h(DashboardOutlined) },
  { key: "/sources", label: "来源", icon: h(FolderOpenOutlined) },
  { key: "/scenarios", label: "场景", icon: h(ApartmentOutlined) },
  { key: "/skills", label: "Skills", icon: h(AppstoreOutlined) },
  { key: "/compare", label: "比对", icon: h(SwapOutlined) },
];

async function navigate(key: string): Promise<void> {
  drawerOpen.value = false;
  await router.push(key);
}
</script>

<template>
  <div class="app-frame">
    <nav
      :class="['sidebar', { collapsed: sidebarCollapsed }]"
      aria-label="主导航"
    >
      <router-link class="brand" to="/" aria-label="技能管家首页">
        <img class="brand-icon" :src="skillsManagerIconUrl" alt="" />
      </router-link>
      <div class="sidebar-top">
        <span v-show="!sidebarCollapsed" class="brand-name"
          ><strong>技能管家</strong><small>本地浏览器</small></span
        >
        <a-button
          class="collapse-button"
          type="text"
          :aria-label="sidebarCollapsed ? '展开导航' : '收起导航'"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <menu-unfold-outlined v-if="sidebarCollapsed" />
          <menu-fold-outlined v-else />
        </a-button>
      </div>
      <a-menu
        mode="inline"
        :items="navItems"
        :selected-keys="selectedKeys"
        :inline-collapsed="sidebarCollapsed"
        @click="navigate(String($event.key))"
      />
      <router-link class="database-link" to="/status" aria-label="数据库状态">
        <span class="status-dot" aria-hidden="true" /><span
          v-show="!sidebarCollapsed"
          >数据库状态</span
        >
      </router-link>
    </nav>

    <header class="mobile-header">
      <a-button type="text" aria-label="打开导航" @click="drawerOpen = true"
        ><menu-outlined
      /></a-button>
      <router-link class="mobile-brand" to="/">技能管家</router-link>
      <router-link class="mobile-status" to="/status" aria-label="数据库状态"
        ><span class="status-dot"
      /></router-link>
    </header>

    <a-drawer
      v-model:open="drawerOpen"
      placement="left"
      :width="280"
      title="技能管家浏览器"
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

<style scoped>
.app-frame {
  min-height: 100vh;
}
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 10;
  display: flex;
  width: 210px;
  flex-direction: column;
  padding: 26px 18px 22px;
  border-right: 1px solid rgb(25 52 45 / 12%);
  background: rgb(248 246 239 / 94%);
  backdrop-filter: blur(16px);
  transition:
    width 180ms ease,
    padding 180ms ease;
}
.sidebar.collapsed {
  width: 80px;
  padding-inline: 0;
}
.sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 8px 26px;
}
.sidebar.collapsed .sidebar-top {
  justify-content: center;
  margin-inline: 0;
}
.brand {
  display: flex;
  justify-content: center;
  margin: 0 0 20px;
  text-decoration: none;
}
.brand-icon {
  display: block;
  width: 52px;
  height: 52px;
  border-radius: 14px;
}
.collapse-button {
  flex: none;
  color: #58736a;
}
.brand-name strong,
.brand-name small {
  display: block;
}
.brand-name strong {
  font-size: 17px;
  letter-spacing: 0.04em;
}
.brand-name small {
  margin-top: 2px;
  color: #70837d;
  font-size: 11px;
}
:deep(.ant-menu) {
  border-inline-end: 0 !important;
  background: transparent;
}
:deep(.ant-menu-item) {
  margin-block: 6px;
  font-weight: 600;
}
:deep(.ant-menu-item-selected) {
  color: #1f5747;
  background: #dfeadf;
}
.database-link {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: auto 12px 0;
  color: #5d716b;
  font-size: 13px;
  text-decoration: none;
}
.sidebar.collapsed .database-link {
  justify-content: center;
  margin-inline: 0;
}
.status-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border: 2px solid #edf5ec;
  border-radius: 50%;
  background: #3b8b68;
  box-shadow: 0 0 0 1px #3b8b68;
}
.content {
  min-height: 100vh;
  margin-left: 210px;
  padding: 56px 70px 72px;
  container-type: inline-size;
  transition: margin-left 180ms ease;
}
.content.sidebar-collapsed {
  margin-left: 80px;
}
.mobile-header {
  display: none;
}
@media (max-width: 767px) {
  .sidebar {
    display: none;
  }
  .mobile-header {
    position: sticky;
    top: 0;
    z-index: 9;
    display: grid;
    grid-template-columns: 42px 1fr 42px;
    align-items: center;
    height: 58px;
    padding: 0 10px;
    border-bottom: 1px solid rgb(25 52 45 / 12%);
    background: rgb(248 246 239 / 94%);
    backdrop-filter: blur(16px);
  }
  .mobile-brand {
    justify-self: center;
    font-weight: 700;
    text-decoration: none;
  }
  .mobile-status {
    justify-self: center;
  }
  .content {
    margin-left: 0;
    padding: 24px 18px 48px;
  }
  .content.sidebar-collapsed {
    margin-left: 0;
  }
}
</style>
