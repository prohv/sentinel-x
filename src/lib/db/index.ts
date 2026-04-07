import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

// The local-only database file
const sqlite = new Database("sentinel.db");
export const db = drizzle(sqlite);
