/**
 * 来源规范化服务，安全去除 URL 修饰信息并保留非 URL 来源的完整语义。
 * 作者：NDP Coding
 * 日期：2026-07-17 11:15:00
 */
import type { NormalizedSource, SourceInput } from "@/shared/domain/source";

function encodeSourceId(key: string): string {
  return Buffer.from(key, "utf8").toString("base64url");
}

export function normalizeSource(input: SourceInput): NormalizedSource {
  const raw = input.sourceRefResolved?.trim() || input.sourceRef?.trim();
  const type = input.sourceType?.trim() || "unknown";
  if (!raw) {
    const key = `unknown:${type}`;
    return {
      id: encodeSourceId(key),
      key,
      name: "未知来源",
      type,
      externalUrl: null,
    };
  }

  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") {
      url.search = "";
      url.hash = "";
      url.pathname = url.pathname.replace(/\/+$/, "").replace(/\.git$/i, "");
      const key = `${url.protocol}//${url.host.toLowerCase()}${url.pathname}`;
      const segments = url.pathname.split("/").filter(Boolean);
      const repositoryName = segments.slice(-2).join("/");
      const name =
        url.hostname.toLowerCase() === "github.com" && repositoryName
          ? repositoryName
          : repositoryName || url.hostname;
      return { id: encodeSourceId(key), key, name, type, externalUrl: key };
    }
  } catch {
    // 非 HTTP URL 和本地路径按完整文本聚合，不主动裁剪可能有业务含义的路径段。
  }

  const key = `${type}:${raw}`;
  const parts = raw.split(/[\\/]/).filter(Boolean);
  return {
    id: encodeSourceId(key),
    key,
    name: parts.at(-1)?.replace(/\.git$/i, "") || raw,
    type,
    externalUrl: null,
  };
}
