
/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,

  outputFileTracingRoot: path.join(__dirname),

  // Native SQLite module
  serverExternalPackages: ["better-sqlite3"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
};

module.exports = nextConfig;
