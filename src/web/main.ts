/**
 * Vue 前端入口，注册 Ant Design Vue、vue-i18n 并挂载应用。
 * 全局设计 token 与基础样式在 src/web/styles/{tokens,base}.css 中。
 * i18n locale 解析与持久化由 initLocale 在挂载后统一处理。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:05:00
 */
import "./styles/tokens.css";
import "./styles/base.css";
import "ant-design-vue/dist/reset.css";

import Antd from "ant-design-vue";
import { createApp } from "vue";

import App from "./App.vue";
import { i18n, initLocale } from "./i18n";
import { router } from "./router";

createApp(App).use(Antd).use(i18n).use(router).mount("#app");

// 解析 localStorage / navigator.languages / fallback 并刷新 <html lang>。
initLocale();
