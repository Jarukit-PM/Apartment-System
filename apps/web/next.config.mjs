import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  /** Ensure next-intl JSON and i18n config ship in Docker `standalone` output (avoids runtime / locale 404s). */
  outputFileTracingIncludes: {
    "/**": ["./messages/**/*.json", "./i18n/**/*.ts"],
  },
  webpack: (config, { dev }) => {
    // PackFileCacheStrategy / FileSystemInfo “import(t)” lines come from webpack’s
    // infrastructure logger, not compilation warnings — ignoreWarnings does not apply.
    // next-intl triggers this; harmless. Quieter dev logs without hiding compile errors.
    if (dev) {
      config.infrastructureLogging = {
        ...config.infrastructureLogging,
        level: "error",
      };
    }
    return config;
  },
  // Turbopack can bundle PostCSS/Tailwind in a way that breaks `require("lightningcss-*")`
  // for native bindings; keep these on the Node resolution path.
  serverExternalPackages: [
    "lightningcss",
    // Optional native bindings (must match lightningcss optionalDependencies)
    "lightningcss-darwin-arm64",
    "lightningcss-darwin-x64",
    "lightningcss-linux-arm64-gnu",
    "lightningcss-linux-arm64-musl",
    "lightningcss-linux-arm-gnueabihf",
    "lightningcss-linux-x64-gnu",
    "lightningcss-linux-x64-musl",
    "lightningcss-win32-arm64-msvc",
    "lightningcss-win32-x64-msvc",
    "lightningcss-freebsd-x64",
    "lightningcss-android-arm64",
    "@tailwindcss/node",
    "@tailwindcss/postcss",
  ],
};

export default withNextIntl(nextConfig);
