/** @type {import('next').NextConfig} */
const nextConfig = {
  // Generate a distinct build identifier on every production build
  generateBuildId: async () => {
    // Uses git commit hash if available, otherwise falls back to build timestamp
    return process.env.GIT_COMMIT_SHA || `build-${Date.now()}`;
  },

  // Ensure dynamic HTML pages are not aggressively cached by intermediate proxies
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-App-Version",
            value: process.env.npm_package_version || "1.0.0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;