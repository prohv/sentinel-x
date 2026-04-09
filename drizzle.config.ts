import { defineConfig } from 'drizzle-kit';
import { join } from 'path';
import { homedir } from 'os';

const GARRISON_DB = join(homedir(), '.sentinel-x', 'garrison.db');

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: GARRISON_DB,
  },
});
