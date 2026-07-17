/**
 * 前端路由表，提供稳定一级入口并让业务筛选状态后续落在 URL 查询参数中。
 * meta.titleKey 供 afterEach 钩子把当前页面国际化标题写回 document.title。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:55:00
 */
import { createRouter, createWebHistory } from "vue-router";

import { i18n } from "../i18n";
import AppLayout from "../layouts/AppLayout.vue";
import OverviewView from "../views/OverviewView.vue";
import ScenariosView from "../views/ScenariosView.vue";
import SkillComparisonView from "../views/SkillComparisonView.vue";
import SkillDetailView from "../views/SkillDetailView.vue";
import SkillsView from "../views/SkillsView.vue";
import SourcesView from "../views/SourcesView.vue";
import StatusView from "../views/StatusView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: AppLayout,
      children: [
        {
          path: "",
          name: "overview",
          component: OverviewView,
          meta: { titleKey: "overview.title" },
        },
        {
          path: "sources",
          name: "sources",
          component: SourcesView,
          meta: { titleKey: "sources.title" },
        },
        {
          path: "sources/:sourceId",
          name: "source-detail",
          component: SourcesView,
          meta: { titleKey: "sources.titleDetail" },
        },
        {
          path: "scenarios",
          name: "scenarios",
          component: ScenariosView,
          meta: { titleKey: "scenarios.title" },
        },
        {
          path: "scenarios/:scenarioId",
          name: "scenario-detail",
          component: ScenariosView,
          meta: { titleKey: "scenarios.title" },
        },
        {
          path: "skills",
          name: "skills",
          component: SkillsView,
          meta: { titleKey: "skills.title" },
        },
        {
          path: "skills/:skillId",
          name: "skill-detail",
          component: SkillDetailView,
          meta: { titleKey: "skillDetail.eyebrow" },
        },
        {
          path: "compare",
          name: "compare",
          component: SkillComparisonView,
          meta: { titleKey: "comparison.title" },
        },
        {
          path: "status",
          name: "status",
          component: StatusView,
          meta: { titleKey: "status.page.title" },
        },
      ],
    },
  ],
});

router.afterEach((to) => {
  const key = (to.meta as { titleKey?: string }).titleKey;
  if (!key) return;
  const translated = i18n.global.t(key);
  document.title = `${translated} · ${i18n.global.t("app.title")}`;
});
