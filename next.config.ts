import type { NextConfig } from 'next';

const contentSecurityPolicy =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.gstatic.com; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: https:; " +
  "font-src 'self' https://fonts.gstatic.com; " +
  "connect-src 'self' https://*.googleapis.com https://*.cloudfunctions.net https://*.run.app https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.google-analytics.com https://firestore.googleapis.com https://firebase.googleapis.com https://aplica-gateway-1xa8cm8z.uc.gateway.dev; " +
  "frame-src https://www.google.com https://recaptcha.google.com; " +
  "frame-ancestors 'none';";

const nextConfig: NextConfig = {
  /* config options here */
  // En desarrollo, usa NEXT_PUBLIC_API_BASE_URL=/api-proxy (ver .env.local) para que las
  // peticiones vayan al mismo origen y Next reenvíe al gateway; así se evita el fallo de
  // preflight CORS desde localhost. En producción, la URL del gateway debe ir en env (Vercel).
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination:
          'https://aplica-gateway-1xa8cm8z.uc.gateway.dev/:path*',
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    const baseHeaders: { key: string; value: string }[] = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
      { key: 'Content-Security-Policy', value: contentSecurityPolicy },
    ];

    if (process.env.NODE_ENV === 'production') {
      baseHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
      });
    }

    return [
      {
        source: '/:path*',
        headers: baseHeaders,
      },
    ];
  },
};

export default nextConfig;
