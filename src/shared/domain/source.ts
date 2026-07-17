/**
 * 来源领域模型，定义跨数据库记录稳定聚合所需的标识、名称与安全外链。
 * 作者：NDP Coding
 * 日期：2026-07-17 11:15:00
 */
export type SourceInput = {
  sourceType: string | null;
  sourceRef: string | null;
  sourceRefResolved: string | null;
};

export type NormalizedSource = {
  id: string;
  key: string;
  name: string;
  type: string;
  externalUrl: string | null;
};
