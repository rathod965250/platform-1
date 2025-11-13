import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  // Set root directory to silence multiple lockfiles warning
  // This is needed when there are multiple package-lock.json files in parent directories
};

export default nextConfig;
