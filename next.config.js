/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server build (.next/standalone) for the Docker image.
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "visionaid.org" }],
  },
  webpack(config) {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    return config;
  },
};

module.exports = nextConfig;
