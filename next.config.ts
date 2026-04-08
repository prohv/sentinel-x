import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bun:sqlite', 'better-sqlite3'],
  },
  webpack: (config) => {
    config.externals.push('bun:sqlite');
    return config;
  },
  turbopack: {},
};

export default nextConfig;
