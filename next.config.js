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