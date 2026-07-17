/**
 * 将 Vite 构建产物编码进 TypeScript 模块，使生产服务和单文件程序无需外部静态目录。
 * 作者：NDP Coding
 * 日期：2026-07-17 13:35:00
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";

const webDirectory = resolve("dist/web");
const outputPath = resolve("src/server/generated-static-assets.ts");
const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

async function filesIn(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) =>
      entry.isDirectory()
        ? await filesIn(join(directory, entry.name))
        : [join(directory, entry.name)],
    ),
  );
  return nested.flat();
}

const assets: Record<string, { contentType: string; bodyBase64: string }> = {};
for (const file of await filesIn(webDirectory)) {
  const routePath = `/${relative(webDirectory, file).split(sep).join("/")}`;
  assets[routePath] = {
    contentType: contentTypes[extname(file)] || "application/octet-stream",
    bodyBase64: (await readFile(file)).toString("base64"),
  };
}
const source = `/** 此文件由 bun run assets:embed 生成，请勿手工修改。 */\nexport const embeddedStaticAssets: Record<string, { contentType: string; bodyBase64: string }> = ${JSON.stringify(assets)};\n`;
await writeFile(outputPath, source, "utf8");
console.info(`已嵌入 ${Object.keys(assets).length} 个前端资源。`);
