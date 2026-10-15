declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    STAFF_USERNAME?: string;
    STAFF_PASSWORD_HASH?: string;
    STAFF_SESSION_SECRET?: string;
    MOBILE_SESSION_SECRET?: string;
    MOBILE_DEV_AUTH?: string;
  }
}
