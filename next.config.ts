import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use turbopack (Next.js 16 default)
  turbopack: {
    resolveAlias: {
      // Handle pdf.js canvas dependency (not needed for text extraction)
      canvas: { browser: '' },
    },
  },
  reactStrictMode: true,
};

export default nextConfig;
