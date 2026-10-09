/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Permissions-Policy', value: 'camera=(self)' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    }];
  },
  async redirects() {
    return [
      { source: '/app.html', destination: '/practice', permanent: false },
      { source: '/index.html', destination: '/', permanent: false },
    ];
  },
};

export default nextConfig;
