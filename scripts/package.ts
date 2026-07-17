/**
 * 当前平台单文件打包入口，把服务端与已嵌入前端资源编译为独立 Bun 可执行文件。
 * 作者：NDP Coding
 * 日期：2026-07-17 13:35:00
 */
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve("dist/skills-manager-explorer");
await mkdir(resolve("dist"), { recursive: true });
const processResult = Bun.spawn(
  ["bun", "build", "--compile", "src/server/index.ts", "--outfile", output],
  { stdout: "inherit", stderr: "inherit" },
);
const exitCode = await processResult.exited;
if (exitCode !== 0) process.exit(exitCode);
console.info(`已生成单文件程序：${output}`);
