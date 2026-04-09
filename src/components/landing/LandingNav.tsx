'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 64;
  window.scrollTo({ top, behavior: 'smooth' });
}

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinkClass =
    'font-manrope text-sm text-zinc-600 hover:text-violet-700 transition-colors';

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300
        ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md border-b border-zinc-100 shadow-sm'
            : 'bg-white/60 backdrop-blur-sm border-b border-transparent'
        }
        px-6 md:px-10 py-3`}
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between">
        {/* Left: Logo + Name */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="Sentinel X"
              width={28}
              height={28}
              priority
            />
          </div>
          <span className="font-epilogue font-bold text-base text-zinc-950 tracking-tight">
            Sentinel X
          </span>
        </Link>

        {/* Center: Nav Links (desktop) */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/docs" className={navLinkClass}>
            Docs
          </Link>

          <button
            onClick={() => scrollTo('hero-visual')}
            className={navLinkClass}
          >
            Preview
          </button>

          <button onClick={() => scrollTo('features')} className={navLinkClass}>
            Features
          </button>

          <Link href="/dashboard" className={navLinkClass}>
            Dashboard
          </Link>
        </div>

        {/* Right: Open Dashboard pill + mobile hamburger */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            id="nav-open-dashboard"
            className="hidden md:inline-flex font-manrope font-semibold text-sm
                       bg-zinc-950 text-white px-4 py-2 rounded-full
                       hover:bg-zinc-800 transition-colors min-h-[36px] items-center"
          >
            Open Dashboard
          </Link>

          <button
            id="nav-mobile-menu-toggle"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden text-zinc-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-100 mt-2 pt-4 pb-4 px-6 flex flex-col gap-4">
          <Link
            href="/docs"
            onClick={() => setMobileOpen(false)}
            className="font-manrope text-sm text-zinc-700 hover:text-violet-700 transition-colors py-2"
          >
            Docs
          </Link>

          <button
            onClick={() => {
              scrollTo('hero-visual');
              setMobileOpen(false);
            }}
            className="font-manrope text-sm text-zinc-700 hover:text-violet-700 transition-colors py-2 text-left"
          >
            Preview
          </button>

          <button
            onClick={() => {
              scrollTo('features');
              setMobileOpen(false);
            }}
            className="font-manrope text-sm text-zinc-700 hover:text-violet-700 transition-colors py-2 text-left"
          >
            Features
          </button>

          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="font-manrope text-sm text-zinc-700 hover:text-violet-700 transition-colors py-2"
          >
            Dashboard
          </Link>

          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="font-manrope font-semibold text-sm bg-zinc-950 text-white
                       px-5 py-3 rounded-full text-center hover:bg-zinc-800 transition-colors
                       w-full min-h-[44px] flex items-center justify-center"
          >
            Open Dashboard
          </Link>
        </div>
      )}
    </nav>
  );
}
