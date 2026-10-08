import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // App privada: el <meta robots> del layout solo cubre el HTML; esto cubre
  // también /api/* y las imágenes de R2. Los archivos de public/ van por
  // public/_headers porque Cloudflare los sirve sin pasar por el Worker.
  // En vinext '/:path*' no incluye la raíz: por eso '/' va aparte.
  async headers() {
    const headers = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
    return [
      { source: '/', headers },
      { source: '/:path*', headers },
    ];
  },
};

export default nextConfig;
