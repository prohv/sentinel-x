import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { NextResponse } from 'next/server';

export async function GET() {
  const filePath = path.join(process.cwd(), 'CHANGELOG.md');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const html = await marked(raw);
  return NextResponse.json({ html });
}
