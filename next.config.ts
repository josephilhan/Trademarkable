import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Output standalone for Docker optimization
  output: 'standalone',
};

export default nextConfig;
