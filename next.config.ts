import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/ko",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
