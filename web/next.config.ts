import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore ESLint rule failures during build on Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript errors during build 
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
