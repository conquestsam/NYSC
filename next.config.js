/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
    esmExternals: 'loose', // Helps with ESM module compatibility
  },
  images: {
    domains: ['images.pexels.com', 'ijspmapsslaorufibuua.supabase.co'],
    minimumCacheTTL: 60, // Add cache control
  },
  eslint: {
    ignoreDuringBuilds: true, // Bypass ESLint during build
  },
  typescript: {
    ignoreBuildErrors: true, // Temporarily bypass TypeScript errors
  },
  webpack: (config, { isServer, dev }) => {
    // Disable caching in development
    if (dev) {
      config.cache = false;
    }

    // Add support for .mjs files (Supabase related)
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    // Improve chunking strategy
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 244 * 1024, // 244KB
      };
    }

    return config;
  },
  // Enable React strict mode
  reactStrictMode: true,
  // Configure output for Vercel
  output: 'standalone',
}

module.exports = nextConfig