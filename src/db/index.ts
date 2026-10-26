import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

// ":memory:" in tests; a file next to the app otherwise
const file = process.env.DATABASE_PATH ?? "data/punchcard.db";
if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });

const sqlite = new Database(file);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export type Db = typeof db;

// Migrating on startup keeps setup to `pnpm dev`; fine for a single SQLite file
migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
