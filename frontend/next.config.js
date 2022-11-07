module.exports = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'comet.com']
  },
  experimental: {
    runtime: 'nodejs',
    appDir: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
