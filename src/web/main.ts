/**
 * Vue 前端入口，注册 Ant Design Vue 并挂载应用。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:05:00
 */
import "ant-design-vue/dist/reset.css";

import Antd from "ant-design-vue";
import { createApp } from "vue";

import App from "./App.vue";
import { router } from "./router";

createApp(App).use(Antd).use(router).mount("#app");
