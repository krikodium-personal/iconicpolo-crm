import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { WebApp } from './webapp';
const sans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const mono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
export const metadata: Metadata = {
  title: 'Iconic CRM · Gestión ecuestre',
  description: 'Clientes, productos, proveedores y pedidos de Iconic.',
  applicationName: 'Iconic CRM',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Iconic',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  other: { 'mobile-web-app-capable': 'yes' },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#102d29',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${sans.variable} ${mono.variable}`}>
        <WebApp />
        {children}
      </body>
    </html>
  );
}
