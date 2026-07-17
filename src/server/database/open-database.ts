/**
 * SQLite 连接工厂，禁止隐式建库，并把浏览连接与唯一写连接分离。
 * 作者：NDP Coding
 * 日期：2026-07-17 10:20:00
 */
import { Database } from "bun:sqlite";
import { existsSync } from "node:fs";

function assertDatabaseExists(databasePath: string): void {
  if (!existsSync(databasePath)) {
    throw new Error("DATABASE_FILE_NOT_FOUND");
  }
}

export function openReadDatabase(databasePath: string): Database {
  assertDatabaseExists(databasePath);
  return new Database(databasePath, {
    readonly: true,
    create: false,
    strict: true,
  });
}

export function openWriteDatabase(databasePath: string): Database {
  assertDatabaseExists(databasePath);
  const database = new Database(databasePath, {
    readwrite: true,
    create: false,
    strict: true,
  });
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA busy_timeout = 1500");
  return database;
}
