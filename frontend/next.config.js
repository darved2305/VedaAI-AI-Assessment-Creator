/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * NEXT_PUBLIC_* vars are baked into the client bundle at build time.
   * For local dev: set them in frontend/.env
   * For production: set them in your deployment platform (Vercel / Netlify /
   *   Railway → Environment Variables) before running the build.
   *
   * Required:
   *   NEXT_PUBLIC_API_URL  – e.g. https://api.vedaai.app/api
   *   NEXT_PUBLIC_WS_URL   – e.g. wss://api.vedaai.app/ws
   */
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
    NEXT_PUBLIC_WS_URL:
      process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/ws",
  },

  images: {
    /* Allow next/image to optimise local public folder images */
    remotePatterns: [],
    /* Keep this off in dev so hot-reload stays fast */
    unoptimized: process.env.NODE_ENV !== "production",
  },

  /* Security headers for production */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
