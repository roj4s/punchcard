import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page depends on the signed-in user, so there is little to prerender;
  // render on request instead of wrapping each page in <Suspense>
  cacheComponents: false,
  // Self-contained server bundle for the Docker image
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
