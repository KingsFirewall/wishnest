declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    TRUST_CHATGPT_AUTH_HEADERS?: string;
  }
}
