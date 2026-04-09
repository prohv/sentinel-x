import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import * as schema from './schema';

// Global home for the garrison database — survives updates & is shared across repos
const GARRISON_DIR = join(homedir(), '.sentinel-x');
const GARRISON_DB = join(GARRISON_DIR, 'garrison.db');

// Auto-create the directory on first run
mkdirSync(GARRISON_DIR, { recursive: true });

// WAL mode for concurrent reads during active scans
const sqlite = new Database(GARRISON_DB);
sqlite.exec('PRAGMA journal_mode = WAL;');
sqlite.exec('PRAGMA synchronous = NORMAL;');
sqlite.exec('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });
export { GARRISON_DB, GARRISON_DIR };
