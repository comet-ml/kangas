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

/*
  async headers() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'query',
            key: 'page',
            value: undefined
          }
        ],
        headers: [
          {
            key: 'Cache-Control',
            value: 'max-age=604800'
          }
        ]
      }
    ]
  }
*/