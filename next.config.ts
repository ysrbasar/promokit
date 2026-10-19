import type { NextConfig } from "next";

const config: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Görseller yerel olarak indirilmediyse kaynak alan adlarından sunulur.
    remotePatterns: [
      { protocol: "https", hostname: "www.ipromosyon.com" },
    ],
  },
  // Turbopack/monorepo kökü: üst klasördeki form360 projesinden ayrık tut.
  outputFileTracingRoot: __dirname,
};

export default config;
