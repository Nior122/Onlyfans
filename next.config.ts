import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allows the hosted dev preview (and other sandbox hosts) to load the dev server.
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev", "localhost:3000", "127.0.0.1:3000"],
};

export default nextConfig;
