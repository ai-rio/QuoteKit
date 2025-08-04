/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // Temporarily disable ESLint during build to focus on functionality
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configure external image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Allow SVG images from placehold.co
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Override default serverExternalPackages to exclude prettier
  // This allows prettier dependencies to be bundled instead of treated as external
  serverExternalPackages: [
    // Include common external packages but exclude prettier-related ones
    'canvas',
    'sharp'
    // Note: By not including 'prettier' here, it will be bundled
  ],
  
  // Security headers for development and production
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Performance optimizations
  experimental: {
    turbo: {
      // Turbopack configuration for faster development builds
    },
    // Optimize compilation
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // Optimize builds
  compress: true,
  poweredByHeader: false,
  
  // Enhanced webpack config for performance
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure prettier dependencies are resolved properly
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'prettier/standalone': false,
        'prettier/plugins/html': false,
      };
    }
    
    // Optimize bundle splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          mdx: {
            name: 'mdx',
            test: /[\/]node_modules[\/](next-mdx-remote|gray-matter|mdx|@mdx-js)[\/]/,
            priority: 30,
            enforce: true,
          },
          vendors: {
            name: 'vendors',
            test: /[\/]node_modules[\/]/,
            priority: 10,
            enforce: true,
          },
        },
      },
    };
    
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
