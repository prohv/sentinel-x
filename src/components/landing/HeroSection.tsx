import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="pt-24 pb-0 px-4 text-center">
      <div className="mx-auto max-w-4xl">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 bg-zinc-100 rounded-full px-3 py-1 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          <span className="font-manrope text-xs text-zinc-600">
            Born from the 2026 Axios supply chain breach
          </span>
        </div>

        {/* Hero headline */}
        <h1
          className="font-epilogue font-extrabold text-5xl md:text-6xl lg:text-7xl
                       text-zinc-950 leading-[1.05] tracking-tight"
        >
          The Sovereign
          <br />
          Security Layer
          <br />
          for Your Codebase.
        </h1>

        {/* Subheadline */}
        <p
          className="mt-6 font-manrope text-base md:text-lg text-zinc-500
                      max-w-xl mx-auto leading-relaxed"
        >
          Detect, map, and neutralise tainted Non-Human Identities — entirely on
          your machine. No cloud. No leaks.
        </p>

        {/* CTA buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            id="hero-cta-primary"
            className="font-manrope font-semibold text-sm bg-zinc-950 text-white
                       px-6 py-3.5 rounded-full hover:bg-zinc-800 transition-colors
                       w-full sm:w-auto min-h-[44px] flex items-center justify-center"
          >
            Get Started — It&apos;s Free
          </Link>

          <Link
            href="/docs"
            id="hero-cta-secondary"
            className="font-manrope font-semibold text-sm text-zinc-700
                       border border-zinc-300 px-6 py-3.5 rounded-full
                       hover:border-zinc-500 hover:text-zinc-950 transition-colors
                       w-full sm:w-auto min-h-[44px] flex items-center justify-center"
          >
            Read the Docs →
          </Link>
        </div>
      </div>
    </section>
  );
}
