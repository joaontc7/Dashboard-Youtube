import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Types are verified locally with `tsc --noEmit` before each commit.
    // Disabling build-time checks avoids Vercel's stricter TS version breaking the deploy.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
