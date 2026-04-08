import Image from 'next/image';

export function HeroVisual() {
  return (
    <div className="mt-14 mx-auto max-w-6xl px-4 pb-0">
      <div
        className="hero-visual-gradient rounded-3xl overflow-hidden
                      min-h-[320px] md:min-h-[520px] relative"
      >
        {/* Dashboard screenshot rising from bottom */}
        <div className="absolute inset-0 flex items-end justify-center">
          <div
            className="w-[85%] rounded-t-2xl shadow-2xl overflow-hidden relative
                          translate-y-4 md:translate-y-8 border border-white/20"
          >
            <Image
              src="/dashboard-preview.png"
              alt="Sentinel X Dashboard preview"
              width={1200}
              height={700}
              className="object-cover object-top w-full"
              priority
              unoptimized
            />
            {/* Fallback overlay shown regardless — acts as a legible label */}
            <div
              className="absolute inset-0 bg-zinc-950/80 rounded-t-2xl
                            flex items-center justify-center"
            >
              <span className="font-manrope text-xs text-zinc-400 tracking-widest uppercase">
                Dashboard Preview
              </span>
            </div>
          </div>
        </div>

        {/* ── Floating chips (Desktop only) ── */}

        {/* Top-left: Ghost Hunter */}
        <div
          className="hidden md:block absolute top-12 left-12
                        bg-white rounded-2xl shadow-lg px-4 py-3 max-w-[200px]"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-zinc-200 shrink-0" />
            <span className="font-manrope text-xs font-medium text-zinc-900">
              Ghost Hunter
            </span>
            <span
              className="bg-rose-500 text-white text-[10px] font-manrope
                             rounded-full px-2 py-0.5 ml-auto shrink-0"
            >
              18 New
            </span>
          </div>
          <p className="font-manrope text-[11px] text-zinc-500">
            AKIA•••• detected in /config
          </p>
        </div>

        {/* Top-right: Vault */}
        <div
          className="hidden md:block absolute top-12 right-12
                        bg-white rounded-2xl shadow-lg px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-zinc-200 shrink-0" />
            <span className="font-manrope text-xs font-medium text-zinc-900">
              Vault
            </span>
            <span
              className="bg-emerald-500 text-white text-[10px] font-manrope
                             rounded-full px-2 py-0.5"
            >
              Secure
            </span>
          </div>
        </div>

        {/* Bottom-left: Taint Analyzer */}
        <div
          className="hidden md:block absolute bottom-16 left-12
                        bg-white rounded-2xl shadow-lg px-4 py-3 max-w-[220px]"
        >
          <p className="font-manrope font-semibold text-xs text-zinc-900">
            Taint Analyzer
          </p>
          <p className="font-manrope text-[11px] text-zinc-500 mt-0.5">
            axios@1.14.1 — Critical breach vector
          </p>
        </div>
      </div>
    </div>
  );
}
