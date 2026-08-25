/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Tell Next.js to keep pg and bcryptjs as native Node.js modules
  // and NOT bundle them into the serverless function bundle.
  experimental: {
    serverComponentsExternalPackages: ['pg', 'pg-native', 'bcryptjs'],
  },

  // Prevent client-side bundle from trying to resolve server-only Node modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        pg: false,
        'pg-native': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

