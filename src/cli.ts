#!/usr/bin/env bun
/**
 * Sentinel-X CLI — "The Herald"
 * Starts the Next.js standalone server and opens the browser.
 *
 * Commands:
 *   sentinel           → starts server, opens landing page
 *   sentinel dash      → starts server, opens dashboard
 *   sentinel scan [path] → headless terminal scan, no UI
 */

import { program } from 'commander';
import open from 'open';
import { join } from 'path';
import { existsSync } from 'fs';
import { spawn } from 'child_process';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const PACKAGE_ROOT = join(import.meta.dirname, '..');

// Resolve standalone server path (production) or fall back to next start (dev)
function getServerPath(): string {
  const standalone = join(PACKAGE_ROOT, '.next', 'standalone', 'server.js');
  if (existsSync(standalone)) return standalone;
  throw new Error(
    '[Sentinel-X] Standalone build not found. Run: bun run build',
  );
}

function startServer(openPath: string, scanPath?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const serverPath = getServerPath();
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      PORT: String(PORT),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
    };

    // Pass caller's working directory so the dashboard auto-detects repos
    if (scanPath) {
      env.SENTINEL_SCAN_PATH = scanPath;
    } else {
      env.SENTINEL_SCAN_PATH = process.cwd();
    }

    console.log(`\n🛡️  Sentinel-X starting on http://localhost:${PORT}...\n`);

    const server = spawn('bun', ['run', serverPath], {
      env,
      stdio: 'pipe',
      cwd: PACKAGE_ROOT,
    });

    server.stdout?.once('data', async () => {
      const url = `http://localhost:${PORT}${openPath}`;
      console.log(`✓  Opening ${url}`);
      await open(url);
      resolve();
    });

    server.stderr?.on('data', (chunk: Buffer) => {
      // Suppress routine Next.js startup noise
      const msg = chunk.toString();
      if (msg.includes('Ready') || msg.includes('started')) return;
      process.stderr.write(chunk);
    });

    server.on('error', reject);
  });
}

async function runHeadlessScan(repoPath: string) {
  const target = repoPath ? join(process.cwd(), repoPath) : process.cwd();
  console.log(`\n🔍  Sentinel-X headless scan → ${target}\n`);

  // Import scanner directly — no UI overhead
  const { runGhostHunter } = await import('./scanner/ghost-hunter');
  const { db } = await import('./lib/db/index');
  const { runMigrations } = await import('./lib/db/migrate');

  await runMigrations();

  const { scans } = await import('./lib/db/schema');
  const { sql } = await import('drizzle-orm');

  const [scan] = db
    .insert(scans)
    .values({
      type: 'ghost_hunter',
      status: 'running',
      startedAt: new Date(),
      repoPath: target,
    })
    .returning()
    .all();

  let count = 0;
  for await (const finding of runGhostHunter(target)) {
    count++;
    process.stdout.write(
      `  [${finding.severity.toUpperCase()}] ${finding.path}:${finding.line} — ${finding.rule}\n`,
    );
  }

  db.run(
    sql`UPDATE scans SET status = 'completed', total_findings = ${count}, finished_at = ${Date.now()} WHERE id = ${scan.id}`,
  );

  console.log(
    `\n✓  Scan complete. ${count} findings. DB: ~/.sentinel-x/garrison.db\n`,
  );
}

// ── CLI Definition ─────────────────────────────────────────────────────────

program
  .name('sentinel')
  .description('Sentinel-X — Sovereign security scanner for your codebase')
  .version('3.1.0');

program
  .command('dash', { isDefault: false })
  .description('Start the dashboard and open it in your browser')
  .option('-p, --port <port>', 'Port to run on', '3000')
  .action(async () => {
    await startServer('/dashboard');
  });

program
  .command('scan [path]')
  .description('Run a headless scan without the UI (pure terminal)')
  .action(async (path?: string) => {
    await runHeadlessScan(path ?? '');
  });

// Default command — start server and open landing page
program
  .command('start', { isDefault: true, hidden: true })
  .description('Start the server (default)')
  .action(async () => {
    await startServer('/');
  });

program.parseAsync(process.argv);
