/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@otsy/ui', '@otsy/types'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000',
  },
  images: {
    domains: ['localhost', 'otsukai.app'],
    formats: ['image/webp', 'image/avif'],
    unoptimized: true, // 静的書き出し時の画像最適化を無効化
  },
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Webpack最適化
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // 本番ビルドでの最適化
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
  // 動的レンダリングを強制
  trailingSlash: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;