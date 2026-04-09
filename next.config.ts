import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['bun:sqlite', 'better-sqlite3'],
  webpack: (config) => {
    config.externals.push('bun:sqlite');
    return config;
  },
  turbopack: {},
};

export default nextConfig;
