import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Important for custom server
  
  typescript: {
    ignoreBuildErrors: true, // Consider setting to false to see any errors
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Add this to ensure API routes are included
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'lodash'
    ],
    // Force Next.js to include all API routes
    outputFileTracingIncludes: {
      '/api/user/profile/lessor-calendar/blocked-periods': ['**/*'],
    },
  },
  
  // Ensure API routes aren't optimized away
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        'socket.io-client': require.resolve('socket.io-client'),
      };
    }
    
    // Add this to preserve API routes
    if (isServer) {
      config.externals = [...(config.externals || []), 'sharp', 'canvas'];
    }
    
    if (!dev && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      );
    }
    
    return config;
  },
  
  // ... rest of your config stays the same
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
  },
  
  compiler: {
    removeConsole: false,
  },
  
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ];
  },
};

export default nextConfig;