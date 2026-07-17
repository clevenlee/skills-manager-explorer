/**
 * 前端路由表，提供稳定一级入口并让业务筛选状态后续落在 URL 查询参数中。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:55:00
 */
import { createRouter, createWebHistory } from "vue-router";

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
        { path: "", name: "overview", component: OverviewView },
        { path: "sources", name: "sources", component: SourcesView },
        {
          path: "sources/:sourceId",
          name: "source-detail",
          component: SourcesView,
        },
        {
          path: "scenarios",
          name: "scenarios",
          component: ScenariosView,
        },
        {
          path: "scenarios/:scenarioId",
          name: "scenario-detail",
          component: ScenariosView,
        },
        { path: "skills", name: "skills", component: SkillsView },
        {
          path: "skills/:skillId",
          name: "skill-detail",
          component: SkillDetailView,
        },
        {
          path: "compare",
          name: "compare",
          component: SkillComparisonView,
        },
        { path: "status", name: "status", component: StatusView },
      ],
    },
  ],
});
