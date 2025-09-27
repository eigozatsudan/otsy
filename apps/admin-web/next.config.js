/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@otsy/ui', '@otsy/types'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000',
  },
  images: {
    domains: ['localhost', 'otsy.app'],
    formats: ['image/webp', 'image/avif'],
    unoptimized: true, // 静的書き出し時の画像最適化を無効化
  },
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'recharts'],
  },
  // 動的レンダリングを強制
  trailingSlash: false,
  output: 'standalone',
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