'use client';

import { useEffect } from 'react';

export function WebApp() {
  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator &&
        Boolean(
          (navigator as Navigator & { standalone?: boolean }).standalone,
        ));
    document.documentElement.classList.toggle('webapp-standalone', standalone);
    /*
      El service worker sólo en producción. En desarrollo no aporta —es para
      que la app instalada funcione sin conexión— y sí molesta: cachea
      archivos viejos, así que un cambio recién hecho puede no verse y se
      termina culpando al código. Además algunos navegadores embebidos (el
      panel de vista previa, por ejemplo) no permiten registrarlo y dejan un
      error en la consola que no significa nada.
    */
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch((error) => {
        // Si el navegador no lo permite, la app funciona igual: sólo pierde
        // el modo sin conexión.
        console.warn('[WebApp] no se pudo registrar el service worker', error);
      });
    }
  }, []);
  return null;
}
