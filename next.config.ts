import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Allow proxying to ServiceDesk Plus in dev
  async rewrites() {
    if (process.env.SDP_BASE_URL) {
      return [
        {
          source: "/sdp-proxy/:path*",
          destination: `${process.env.SDP_BASE_URL}/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
