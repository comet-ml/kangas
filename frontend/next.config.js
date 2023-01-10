module.exports = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'comet.com']
  },
  experimental: {
    runtime: 'nodejs',
    appDir: true,
    fetchCache: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
