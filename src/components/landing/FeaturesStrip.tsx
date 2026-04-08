type Feature = {
  icon: string;
  iconBg: string;
  title: string;
  body: string;
};

const FEATURES: Feature[] = [
  {
    icon: '👻',
    iconBg: 'bg-zinc-950',
    title: 'Ghost Hunter',
    body: 'Recursive file + git history scanner. Finds secrets that were deleted 30 commits ago.',
  },
  {
    icon: '⚠',
    iconBg: 'bg-rose-500',
    title: 'Taint Analyzer',
    body: 'Detects supply chain breaches like the 2026 Axios attack. Correlates packages to exposed secrets instantly.',
  },
  {
    icon: '🔒',
    iconBg: 'bg-violet-600',
    title: 'Local Vault',
    body: 'Encrypts and stores NHIs locally. Replaces raw secrets with SENTINEL_REF_IDs. Zero cloud. Zero telemetry.',
  },
];

export function FeaturesStrip() {
  return (
    <section className="py-20 px-4">
      <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100"
          >
            <div
              className={`w-9 h-9 rounded-xl ${feature.iconBg} flex items-center
                          justify-center text-white mb-4 text-lg`}
            >
              {feature.icon}
            </div>
            <h3 className="font-epilogue font-bold text-base text-zinc-900">
              {feature.title}
            </h3>
            <p className="font-manrope text-sm text-zinc-500 mt-2 leading-relaxed">
              {feature.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
