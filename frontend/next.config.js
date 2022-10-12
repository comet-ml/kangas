module.exports = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'comet.com']
  },
  experimental: {
    runtime: 'nodejs',
    serverComponents: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
