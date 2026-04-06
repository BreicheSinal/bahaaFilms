/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@portfolio/shared"],
  images: {
    domains: ["images.unsplash.com"],
  },
};

module.exports = nextConfig;
