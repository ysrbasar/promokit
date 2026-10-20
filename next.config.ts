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
  // Depodaki başlangıç kataloğu sunucu paketine girsin (Netlify vb.). runtime/ ve private/ asla dahil edilmez.
  outputFileTracingIncludes: { "/**/*": ["./data/*.json"] },
  outputFileTracingExcludes: { "/**/*": ["./data/private/**", "./data/runtime/**"] },
};

export default config;
