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
    // Optimize dev server startup
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  // Optimize webpack for better tree-shaking and smaller bundles
  webpack: (config, { isServer, webpack }) => {
    // Externalize server-only packages to avoid bundling them in client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    // Fix for webpack hash calculation errors with null files
    // This can happen with pnpm symlinks or corrupted cache
    const originalReadFile = config.infrastructureLogging
    config.infrastructureLogging = {
      ...originalReadFile,
      level: 'error',
    }

    // Add error handling for file reads
    config.module = config.module || {}
    config.module.rules = config.module.rules || []
    
    // Wrap file system operations to handle null reads
    const originalFileSystem = config.resolveLoader?.fileSystem
    if (originalFileSystem) {
      const safeFileSystem = {
        ...originalFileSystem,
        readFile: function(...args) {
          const callback = args[args.length - 1]
          const originalCallback = typeof callback === 'function' ? callback : null
          if (originalCallback) {
            args[args.length - 1] = function(err, data) {
              if (err || data === null || data === undefined) {
                return originalCallback(new Error('File read returned null or undefined'))
              }
              return originalCallback(err, data)
            }
          }
          return originalFileSystem.readFile.apply(this, args)
        },
      }
      config.resolveLoader = config.resolveLoader || {}
      config.resolveLoader.fileSystem = safeFileSystem
    }

    return config
  },
}

module.exports = withNextIntl(nextConfig)
