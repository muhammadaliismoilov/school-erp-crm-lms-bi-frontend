/** @type {import('next').NextConfig} */
const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://localhost:3000";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Proxy API calls through Next so the browser talks same-origin and the
  // backend base URL stays a single server-side env var.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
