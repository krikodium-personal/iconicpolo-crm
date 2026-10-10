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
  // App privada: que Google no la indexe. Va como <meta robots>, no como
  // Disallow en robots.txt: si se bloquea el rastreo, Google no llega a leer el noindex.
  robots: { index: false, follow: false },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
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
      <head>
        {/*
          Las once tipografías de bordado del sitio que no son de sistema. Van
          por hoja de estilo y no por next/font porque la ficha las dibuja en un
          canvas con `ctx.font`, que necesita el nombre real de la familia y no
          una variable CSS. Es la misma lista que carga el personalizador de
          iconicpolo.com.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* oxlint-disable-next-line next/no-page-custom-font -- La regla es del Pages Router; acá el layout raíz lo carga para toda la app. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Alegreya:wght@700&family=Alfa+Slab+One&family=Arimo:wght@700&family=Cinzel:wght@700&family=Coda:wght@800&family=Fjalla+One&family=Fugaz+One&family=Oswald:wght@700&family=Playfair+Display:wght@700&family=Rubik+Mono+One&family=Syncopate:wght@700&display=swap"
        />
      </head>
      <body className={`${sans.variable} ${mono.variable}`}>
        <WebApp />
        {children}
      </body>
    </html>
  );
}
