const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  // Optimize bundle size
  experimental: {
    serverMinification: true,
  },
  // Optimize webpack for better tree-shaking and smaller bundles
  webpack: (config, { isServer }) => {
    // Externalize server-only packages to avoid bundling them in client
    if (isServer) {
      // Externalize nodemailer on server-side to avoid bundling issues
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push('nodemailer')
      } else {
        config.externals = [config.externals, 'nodemailer']
      }
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    return config
  },
}

module.exports = withNextIntl(nextConfig)
