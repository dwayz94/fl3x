import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@fl3x/shared"],
  async rewrites() {
    // fl3x.lol/@username → public profile
    return [{ source: "/@:username", destination: "/u/:username" }];
  },
};

export default nextConfig;
