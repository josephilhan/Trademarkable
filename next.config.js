/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Hardcode the Convex URL
  env: {
    NEXT_PUBLIC_CONVEX_URL: 'https://spotted-viper-423.convex.cloud',
  },
  
  // Output standalone for Docker optimization
  output: 'standalone',
}

module.exports = nextConfig