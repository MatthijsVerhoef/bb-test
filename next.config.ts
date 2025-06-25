// next.config.mjs - Optimized version
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization
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
    // Performance optimizations
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false, // Security improvement
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'] // Keep error and warn logs
    } : false,
  },

  // Experimental features for performance
  experimental: {
    // Optimize CSS processing
    optimizeCss: true,
    
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      'date-fns',
      'lodash'
    ],

    // Enable modern bundling
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Fix for socket.io-client
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'socket.io-client': require.resolve('socket.io-client'),
      };
    }

    // Production optimizations
    if (!dev) {
      // Tree shaking improvements
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };

      // Bundle analyzer in production build
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        );
      }
    }

    return config;
  },

  // Output configuration for better caching
  generateBuildId: async () => {
    // Use timestamp for development, git hash for production
    if (process.env.NODE_ENV === 'development') {
      return 'development';
    }
    return null; // Use default Next.js build ID
  },

  // Optimize static generation
  trailingSlash: false,
  
  // Enable SWC minification (faster than Terser)
  swcMinify: true,

  // PoweredBy header removal for security
  poweredByHeader: false,

  // Compress responses
  compress: true,

  // Optimize font loading
  optimizeFonts: true,
};

export default nextConfig;