/**
 * 同源静态资源路由，从编译时嵌入映射提供 Vite 产物并为前端路由回退首页。
 * 作者：NDP Coding
 * 日期：2026-07-17 13:35:00
 */
import type { OpenAPIHono } from "@hono/zod-openapi";

import { embeddedStaticAssets } from "./generated-static-assets";

type Bindings = { Variables: { requestId: string } };
export function registerStaticRoutes(app: OpenAPIHono<Bindings>): void {
  app.get("*", (context) => {
    const path = new URL(context.req.url).pathname;
    if (path.startsWith("/api/")) return context.notFound();
    const asset =
      embeddedStaticAssets[path] ||
      (!path.includes(".") ? embeddedStaticAssets["/index.html"] : undefined);
    if (!asset) return context.notFound();
    return new Response(Buffer.from(asset.bodyBase64, "base64"), {
      headers: {
        "content-type": asset.contentType,
        "cache-control":
          path === "/" || path.endsWith(".html")
            ? "no-cache"
            : "public, max-age=31536000, immutable",
      },
    });
  });
}
