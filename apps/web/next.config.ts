import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@fl3x/shared"],
  async headers() {
    const base = [
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    return [
      { source: "/:path*", headers: base },
      // The dashboard is never framed (clickjacking); public profiles may be embedded.
      { source: "/dashboard/:path*", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'none'" }, { key: "X-Frame-Options", value: "DENY" }] },
    ];
  },
  async redirects() {
    return [{ source: "/dashboard/premium", destination: "/dashboard/plan", permanent: true }];
  },
  async rewrites() {
    // fl3x.lol/@username → public profile
    return [{ source: "/@:username", destination: "/u/:username" }];
  },
};

export default nextConfig;
