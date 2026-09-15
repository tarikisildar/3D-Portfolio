/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
};

export default nextConfig;