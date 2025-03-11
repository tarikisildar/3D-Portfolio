/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add basePath for serving from a subdirectory
  basePath: '/new',
  // Disable error overlay in production
  onDemandEntries: {
    // Keep pages in memory for longer
    maxInactiveAge: 25 * 1000,
    // Don't show error overlay in production
    pagesBufferLength: 2,
  },
  // Add this to disable the error overlay
  devIndicators: {
    position: 'bottom-right',
  },
  // Bypass TypeScript checking during build
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;