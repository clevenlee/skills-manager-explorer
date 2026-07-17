/**
 * 前端开发与构建配置，将 API 请求转发到仅监听本机的 Bun 服务。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:05:00
 */
import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";

type ViteEnvironment = Partial<
  Record<"PORT" | "VITE_API_PORT" | "VITE_PORT", string>
>;

export function resolveVitePorts(env: ViteEnvironment) {
  return {
    webPort: Number(env.VITE_PORT || 5173),
    apiPort: Number(env.VITE_API_PORT || env.PORT || 4173),
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const { webPort, apiPort } = resolveVitePorts(env);

  return {
    plugins: [vue()],
    build: { outDir: "dist/web", emptyOutDir: true },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
      host: "127.0.0.1",
      port: webPort,
      strictPort: true,
      proxy: {
        "/api": { target: `http://127.0.0.1:${apiPort}`, changeOrigin: false },
      },
    },
    preview: { host: "127.0.0.1", port: webPort, strictPort: true },
  };
});
