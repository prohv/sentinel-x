'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ChangelogPage() {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/changelog')
      .then((r) => r.json())
      .then((d) => setHtml(d.html))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-100 px-6 py-3">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Sentinel X" width={24} height={24} />
            <span className="font-epilogue font-bold text-sm text-zinc-950">
              Sentinel X
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/docs"
              className="font-manrope text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/dashboard"
              className="font-manrope font-semibold text-sm bg-zinc-950 text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 md:px-6 py-10 pb-20">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-8 bg-zinc-100 rounded-xl w-1/3" />
            <div className="h-4 bg-zinc-100 rounded w-full" />
            <div className="h-4 bg-zinc-100 rounded w-5/6" />
            <div className="h-4 bg-zinc-100 rounded w-4/6" />
          </div>
        ) : (
          <article
            className="prose-docs"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-5 px-6 text-center">
        <span className="font-manrope text-xs text-zinc-400">
          © 2026 Sentinel X. All rights local.
        </span>
      </footer>
    </div>
  );
}
