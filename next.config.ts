import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // La home (mindtwin-app.vercel.app) entra directo al generador de
        // alta de profesionales, en vez de mostrar la landing de marketing.
        source: "/",
        destination: "/profesionales/contratar",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
