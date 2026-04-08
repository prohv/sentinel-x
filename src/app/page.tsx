import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { HeroVisual } from '@/components/landing/HeroVisual';
import { FeaturesStrip } from '@/components/landing/FeaturesStrip';
import { CtaBand, LandingFooter } from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'Sentinel X — Sovereign Security for Your Codebase',
  description:
    'Detect, map, and neutralise tainted Non-Human Identities entirely on your machine. No cloud. No leaks. Local-first. Zero telemetry.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <HeroSection />
      <HeroVisual />
      <FeaturesStrip />
      <CtaBand />
      <LandingFooter />
    </div>
  );
}
