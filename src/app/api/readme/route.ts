import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { NextResponse } from 'next/server';

// Redirect CHANGELOG.md link to /changelog page
const renderer = new marked.Renderer();
renderer.link = ({
  href,
  title,
  text,
}: {
  href: string;
  title?: string | null;
  text: string;
}) => {
  const finalHref = href === 'CHANGELOG.md' ? '/changelog' : href;
  const titleAttr = title ? ` title="${title}"` : '';
  const external = finalHref.startsWith('http')
    ? ' target="_blank" rel="noopener noreferrer"'
    : '';
  return `<a href="${finalHref}"${titleAttr}${external}>${text}</a>`;
};

export async function GET() {
  const filePath = path.join(process.cwd(), 'README.md');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const html = await marked(raw, { renderer });
  return NextResponse.json({ html });
}
