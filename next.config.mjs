/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Hide the dev-only "Static route" badge in the bottom-left corner.
  devIndicators: {
    appIsrStatus: false,
  },
};

export default nextConfig;
