/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for production deployment
  // Uncomment for production: output: 'export',
  images: {
    unoptimized: true,
  },
  // Exclude backend files from Next.js compilation
  webpack: (config) => {
    config.externals = [...(config.externals || []), { 'src': 'src' }];
    return config;
  },
};

module.exports = nextConfig;
