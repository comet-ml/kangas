module.exports = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'comet.com']
  },
  experimental: {
    appDir: true,
    enableUndici: false
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