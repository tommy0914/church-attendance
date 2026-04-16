/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  reactStrictMode: true,
  turbopack: {}, // Silence Next.js 16 Turbopack/Webpack conflict
  experimental: {
    // any experimental features
  },
};

module.exports = withPWA(nextConfig);
