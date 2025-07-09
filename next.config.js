/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js']
  },
  images: {
    domains: ['images.pexels.com', 'ijspmapsslaorufibuua.supabase.co'],
  },
  // Add webpack configuration to handle potential caching issues
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
}

module.exports = nextConfig