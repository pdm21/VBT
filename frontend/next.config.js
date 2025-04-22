/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.externals = [...config.externals, { serialport: 'serialport' }];
    return config;
  },
};

module.exports = nextConfig;
