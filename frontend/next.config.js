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
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    // Important: return the modified config
    if (isServer) {
      config.module.rules.push({
        test: /\.node$/,
        use: [
          {
            loader: 'node-loader',
            options: {
              name: '[path][name].[ext]'
            }
          }
        ]
      })
    }
    
    return config;

  },  
};
