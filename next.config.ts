import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Site images (e.g. the 1200×630 share image) are uploaded through server actions.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
