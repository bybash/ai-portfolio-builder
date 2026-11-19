import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Browsers and crawlers that ask for /favicon.ico get the generated icon.
      { source: "/favicon.ico", destination: "/icon/32" },
    ];
  },
};

export default nextConfig;
