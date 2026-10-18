import type { NextConfig } from 'next'

const host = (value: string) => [{ type: 'host' as const, value }]

const nextConfig: NextConfig = {
  // the dev badge sits bottom-left by default, on top of the sidebar's Sign out
  devIndicators: { position: 'bottom-right' },
  async rewrites() {
    return {
      // the marketing pages stay static files in /public; each host's root maps to its page
      beforeFiles: [
        { source: '/', has: host('potluck.kiranacounselling.com'), destination: '/diwali-meetup.html' },
        { source: '/', destination: '/home.html' },
        { source: '/onboarding', destination: '/therapy.html' },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
  async redirects() {
    // one public address for the client onboarding page
    return [{ source: '/therapy.html', destination: '/onboarding', permanent: true }]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
        ],
      },
      { source: '/(admin|trainee|client|join|consent|login)(.*)', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
    ]
  },
}

export default nextConfig
