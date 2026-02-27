import '@app-petlar/env/web'
import type { NextConfig } from 'next'
import { hostname } from 'os'

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  serverExternalPackages: ['libsql', '@libsql/client'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'loremflickr.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-2317350396c049578626abefae8595a7.r2.dev',
      },
    ],
  },
}

export default nextConfig
