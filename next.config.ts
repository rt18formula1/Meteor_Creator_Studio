import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ホームディレクトリ等の lockfile 誤検出を防ぐ
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
