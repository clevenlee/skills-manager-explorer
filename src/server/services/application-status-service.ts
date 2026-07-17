/**
 * 应用状态服务，以只读检查诊断数据库并仅返回安全文件名与可行动提示。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:40:00
 */
import { accessSync, constants, existsSync } from "node:fs";
import { basename } from "node:path";

import type { ApplicationStatus } from "@/shared/contracts/status";
import { checkSchema } from "../database/check-schema";
import { openReadDatabase, openWriteDatabase } from "../database/open-database";

function checkWritable(databasePath: string): boolean {
  try {
    accessSync(databasePath, constants.W_OK);
    const database = openWriteDatabase(databasePath);
    database.close();
    return true;
  } catch {
    return false;
  }
}

export function getApplicationStatus(databasePath: string): ApplicationStatus {
  const label = basename(databasePath) || "数据库文件";
  if (!existsSync(databasePath)) {
    return {
      database: {
        state: "missing",
        writable: false,
        label,
        issues: ["数据库文件不存在，请检查 .env 中的路径。"],
      },
    };
  }

  try {
    const database = openReadDatabase(databasePath);
    const compatibility = checkSchema(database);
    database.close();

    if (!compatibility.compatible) {
      return {
        database: {
          state: "incompatible",
          writable: false,
          label,
          issues: compatibility.missing.map((item) => `缺少 ${item}`),
        },
      };
    }

    const writable = checkWritable(databasePath);
    return {
      database: {
        state: "ready",
        writable,
        label,
        issues: writable ? [] : ["数据库为只读，浏览功能仍可使用。"],
      },
    };
  } catch {
    return {
      database: {
        state: "unavailable",
        writable: false,
        label,
        issues: ["无法读取数据库，请检查文件权限或文件格式。"],
      },
    };
  }
}
