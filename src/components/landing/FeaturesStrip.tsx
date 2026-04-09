import {
  ShieldCheck,
  Flame,
  Activity,
  History,
  Lock,
  FileBarChart2,
  LucideIcon,
} from 'lucide-react';

type Feature = {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
};

const FEATURES: Feature[] = [
  {
    icon: ShieldCheck,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    title: 'Offline Scanner',
    body: 'Ghost Hunter scans your filesystem and git history entirely locally. Your code and secrets never leave your machine.',
  },
  {
    icon: Flame,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
    title: 'Git History Purge',
    body: 'A surgical 6-step pipeline to permanently erase secrets from every commit in your history without corrupting the repo.',
  },
  {
    icon: Activity,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    title: 'Taint Tree Analyzer',
    body: 'AST-based analysis traces how secrets propagate from source variables to dangerous sink functions in your code.',
  },
  {
    icon: History,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    title: 'Secret Forensics',
    body: 'Deep-dive into the git lifecycle of any leak. Reconstruct exactly when and how a secret moved through your repository.',
  },
  {
    icon: Lock,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50',
    title: 'Secure Vault',
    body: 'AES-256-GCM authenticated encryption for shielded artifacts. Decouples sensitive data from the local repository state.',
  },
  {
    icon: FileBarChart2,
    iconColor: 'text-zinc-600',
    iconBg: 'bg-zinc-100',
    title: 'Compliance Reporting',
    body: 'Business-readable reports translating technical findings into enterprise risk categories for security audit handoffs.',
  },
];

export function FeaturesStrip() {
  return (
    <section
      id="features"
      className="py-24 px-4 bg-white relative overflow-hidden"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">
            Core Infrastructure
          </h2>
          <h3 className="font-epilogue font-bold text-3xl md:text-4xl text-zinc-900 leading-tight">
            Enterprise-grade security,
            <br />
            <span className="text-violet-600">developer-first simplicity.</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group p-8 rounded-[32px] bg-zinc-50 border border-zinc-100 hover:bg-white hover:border-violet-200 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500"
            >
              <div
                className={`w-12 h-12 rounded-2xl ${feature.iconBg} flex items-center justify-center ${feature.iconColor} mb-6 group-hover:scale-110 transition-transform duration-500`}
              >
                <feature.icon size={24} />
              </div>
              <h3 className="font-epilogue font-bold text-lg text-zinc-900 mb-3">
                {feature.title}
              </h3>
              <p className="font-manrope text-sm text-zinc-500 leading-relaxed">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
