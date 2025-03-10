/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Disable error overlay in production
  onDemandEntries: {
    // Keep pages in memory for longer
    maxInactiveAge: 25 * 1000,
    // Don't show error overlay in production
    pagesBufferLength: 2,
  },
  // Add this to disable the error overlay
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
};

export default nextConfig;