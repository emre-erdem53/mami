import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/pipeline", destination: "/clients", permanent: true }];
  },
};

export default nextConfig;
