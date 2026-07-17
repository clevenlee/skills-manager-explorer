/**
 * Vue 单文件组件类型声明，供 TypeScript 在构建前校验组件导入。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:10:00
 */
/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<
    Record<string, unknown>,
    Record<string, unknown>,
    unknown
  >;
  export default component;
}
