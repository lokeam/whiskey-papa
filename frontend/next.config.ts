import type { NextConfig } from "next";


// Add CSP Headers
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https://ui-avatars.com;
      connect-src 'self';
      object-src 'none';
      base-uri 'self';
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim(),
  },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin '},
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=() '},
];

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
