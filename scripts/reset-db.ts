import { db } from '../src/lib/db';
import { findings, scans } from '../src/lib/db/schema';

async function reset() {
  console.log('Initiating Secure Database Wipe...');
  await db.delete(findings);
  console.log('-> Purged all findings.');
  await db.delete(scans);
  console.log('-> Purged all scan histories.');
  console.log(
    '✅ Database aggressively wiped clean! You can now safely resume the Sentinel-X demo.',
  );
  process.exit(0);
}

reset().catch((e) => {
  console.error('Failed to wipe DB:', e);
  process.exit(1);
});
