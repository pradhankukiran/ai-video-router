import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
