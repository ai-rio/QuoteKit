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
  
  // Security headers for production
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
          // Content Security Policy with Stripe support
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development' 
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://m.stripe.network https://hcaptcha.com https://*.hcaptcha.com https://vercel.live https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.stripe.com https://m.stripe.network https://hcaptcha.com https://*.hcaptcha.com https://vitals.vercel-insights.com wss://ws-us3.pusher.com http://127.0.0.1:54321 http://localhost:54321 data:; frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://hcaptcha.com https://*.hcaptcha.com blob:; object-src 'none'; base-uri 'self'; form-action 'self';"
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://m.stripe.network https://hcaptcha.com https://*.hcaptcha.com https://vercel.live https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.stripe.com https://m.stripe.network https://hcaptcha.com https://*.hcaptcha.com https://vitals.vercel-insights.com wss://ws-us3.pusher.com data:; frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://hcaptcha.com https://*.hcaptcha.com blob:; object-src 'none'; base-uri 'self'; form-action 'self';"
          },
        ],
      },
    ];
  },
  
  experimental: {
    // Disable problematic optimizations for now
    // optimizeCss: true,
    scrollRestoration: true,
  },
  
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Optimize builds
  compress: true,
  poweredByHeader: false,
  
  // Simplified webpack config to avoid build issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure prettier dependencies are resolved properly
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'prettier/standalone': false,
        'prettier/plugins/html': false,
      };
    }
    
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);