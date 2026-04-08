import Link from 'next/link';

export function CtaBand() {
  return (
    <section className="py-20 px-4 border-t border-zinc-100 text-center">
      <h2 className="font-epilogue font-bold text-3xl md:text-4xl text-zinc-950">
        Your secrets stay yours.
      </h2>
      <p className="font-manrope text-sm text-zinc-500 mt-3 max-w-md mx-auto leading-relaxed">
        Sovereign. Local-first. Built for developers who ship fast and
        can&apos;t afford a breach.
      </p>
      <Link
        href="/dashboard"
        id="cta-band-open-dashboard"
        className="mt-6 inline-flex font-manrope font-semibold text-sm
                   bg-zinc-950 text-white px-6 py-3.5 rounded-full
                   hover:bg-zinc-800 transition-colors min-h-[44px] items-center"
      >
        Open Dashboard →
      </Link>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-100 py-6 px-6">
      <div
        className="mx-auto max-w-6xl flex flex-col sm:flex-row
                      items-center justify-between gap-2"
      >
        <span className="font-manrope text-xs text-zinc-400">
          © 2026 Sentinel X. All rights local.
        </span>
        <div className="flex items-center gap-6">
          <Link
            href="/docs"
            className="font-manrope text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            Docs
          </Link>
          <Link
            href="/about"
            className="font-manrope text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            About
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-manrope text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
