export function FindingsStream() {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
      <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-white shrink-0">
        <div>
          <h2 className="font-epilogue font-semibold text-lg text-zinc-900">
            The Spectral Stream
          </h2>
          <p className="font-manrope text-xs text-zinc-500 mt-0.5">
            Latest findings work queue
          </p>
        </div>
        <span className="bg-rose-50 text-rose-600 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-rose-200">
          12 New
        </span>
      </div>

      <div className="overflow-y-auto flex-1 max-h-[350px]">
        <table className="w-full text-sm text-left font-manrope">
          <thead className="bg-zinc-50 sticky top-0 z-10 border-b border-zinc-100">
            <tr>
              <th className="px-5 py-3 font-medium text-xs text-zinc-500 uppercase tracking-widest">
                Severity
              </th>
              <th className="px-5 py-3 font-medium text-xs text-zinc-500 uppercase tracking-widest">
                Path
              </th>
              <th className="px-5 py-3 font-medium text-xs text-zinc-500 uppercase tracking-widest text-right">
                Detected
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {/* Row 1 - Critical */}
            <tr className="hover:bg-zinc-50 transition-colors group cursor-pointer bg-red-50/20">
              <td className="px-5 py-3.5 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Critical
                </span>
              </td>
              <td className="px-5 py-3.5">
                <p className="font-medium text-zinc-900">AWS_KEY</p>
                <p className="font-mono text-xs text-zinc-500 mt-0.5">
                  /config/production.json
                </p>
              </td>
              <td className="px-5 py-3.5 text-right whitespace-nowrap text-zinc-400 text-xs">
                Just now
              </td>
            </tr>

            {/* Row 2 - High */}
            <tr className="hover:bg-zinc-50 transition-colors group cursor-pointer">
              <td className="px-5 py-3.5 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  High
                </span>
              </td>
              <td className="px-5 py-3.5">
                <p className="font-medium text-zinc-900">JWT_TOKEN</p>
                <p className="font-mono text-xs text-zinc-500 mt-0.5">
                  /src/auth/session.ts
                </p>
              </td>
              <td className="px-5 py-3.5 text-right whitespace-nowrap text-zinc-400 text-xs">
                2 min ago
              </td>
            </tr>

            {/* Row 3 - High */}
            <tr className="hover:bg-zinc-50 transition-colors group cursor-pointer">
              <td className="px-5 py-3.5 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  High
                </span>
              </td>
              <td className="px-5 py-3.5">
                <p className="font-medium text-zinc-900">PRIVATE_KEY</p>
                <p className="font-mono text-xs text-zinc-500 mt-0.5">
                  /scripts/deploy.js
                </p>
              </td>
              <td className="px-5 py-3.5 text-right whitespace-nowrap text-zinc-400 text-xs">
                15 min ago
              </td>
            </tr>

            {/* Row 4 - Medium */}
            <tr className="hover:bg-zinc-50 transition-colors group cursor-pointer">
              <td className="px-5 py-3.5 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600">
                  <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                  Medium
                </span>
              </td>
              <td className="px-5 py-3.5">
                <p className="font-medium text-zinc-900">GENERIC_SECRET</p>
                <p className="font-mono text-xs text-zinc-500 mt-0.5">
                  /.env.example
                </p>
              </td>
              <td className="px-5 py-3.5 text-right whitespace-nowrap text-zinc-400 text-xs">
                1 hr ago
              </td>
            </tr>

            {/* Row 5 - Medium */}
            <tr className="hover:bg-zinc-50 transition-colors group cursor-pointer">
              <td className="px-5 py-3.5 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600">
                  <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                  Medium
                </span>
              </td>
              <td className="px-5 py-3.5">
                <p className="font-medium text-zinc-900">STRIPE_TOKEN</p>
                <p className="font-mono text-xs text-zinc-500 mt-0.5">
                  /src/payments/stripe.ts
                </p>
              </td>
              <td className="px-5 py-3.5 text-right whitespace-nowrap text-zinc-400 text-xs">
                3 hrs ago
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
