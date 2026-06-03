import '@app-petlar/env/web'
import { env } from '@app-petlar/env/server'
import type { NextConfig } from 'next'

const r2Hostname = new URL(env.R2_PUBLIC_URL).hostname

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
        hostname: r2Hostname,
      },
    ],
  },
}

export default nextConfig
