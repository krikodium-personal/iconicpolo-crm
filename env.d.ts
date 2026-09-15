declare namespace Cloudflare {
  interface Env {
    FILES: R2Bucket;
  }
}

interface ImportMetaEnv {
  readonly VITE_BUILD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
