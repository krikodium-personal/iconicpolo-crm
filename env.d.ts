declare namespace Cloudflare {
  interface Env {
    FILES: R2Bucket;
    /** Sitio del que se leen las solicitudes de consulta. */
    ICONIC_SITE_ORIGIN?: string;
    /** Secreto compartido con el Worker del sitio. */
    CRM_SHARED_KEY?: string;
  }
}

interface ImportMetaEnv {
  readonly VITE_BUILD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
