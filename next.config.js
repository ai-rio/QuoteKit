/** @type {import('next').NextConfig} */
const nextConfig = {
  // Override default serverExternalPackages to exclude prettier
  // This allows prettier dependencies to be bundled instead of treated as external
  serverExternalPackages: [
    // Include common external packages but exclude prettier-related ones
    'canvas',
    'sharp'
    // Note: By not including 'prettier' here, it will be bundled
  ],
  
  // Turbopack configuration for development with --turbopack flag
  // Note: Turbopack doesn't support resolve.fallback like webpack
  // For now, we'll rely on serverExternalPackages to handle prettier dependencies
  experimental: {
    turbo: {
      // Turbopack configuration can be added here if needed
    },
  },
  
  // Keep webpack config for non-turbopack builds
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

module.exports = nextConfig;