import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  // The division pages moved when Calder became a marketing group; keep the old links working.
  async redirects() {
    return [
      { source: "/trading", destination: "/digital", permanent: false },
      { source: "/capital", destination: "/content", permanent: false },
      { source: "/maritime", destination: "/media", permanent: false },
      { source: "/fort-energy", destination: "/data", permanent: false },
    ];
  },
};

export default nextConfig;
