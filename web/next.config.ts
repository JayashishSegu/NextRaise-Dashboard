import type { NextConfig } from "next";

// Production builds are a static export served by the same Vercel project that
// hosts /api (see ../vercel.json). Local checks run as a normal Next server and
// forward /api to the live deployment, so the screens can be tried without it.
const isExport = process.env.NR_EXPORT === "1";
const API_ORIGIN = process.env.NR_API_ORIGIN ?? "https://nextraise-dashboard-blue.vercel.app";

const config: NextConfig = isExport
  ? { output: "export", images: { unoptimized: true } }
  : {
      async rewrites() {
        return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
      },
    };

export default config;
