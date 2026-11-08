/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@conversio/shared'],
  reactStrictMode: false, // Prevents double-mount in dev triggering duplicate WebRTC peer negotiations
  webpack: (config) => {
    // Avoid node-specific canvas issues with Fabric in browser bundler
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;

