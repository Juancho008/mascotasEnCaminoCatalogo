import crypto from "node:crypto";

export const HMAC_MAX_AGE_MS = 5 * 60 * 1000;

export function buildHmacPayload(method, pathname, timestamp) {
  return `${method.toUpperCase()}\n${pathname}\n${timestamp}`;
}

export function signHmac(secret, method, pathname, timestamp = Date.now().toString()) {
  const payload = buildHmacPayload(method, pathname, timestamp);
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return { timestamp, signature };
}

/** Headers firmados para llamar al Worker de Cloudflare. */
export function createHmacHeaders(secret, method, pathname) {
  const { timestamp, signature } = signHmac(secret, method, pathname);
  return {
    "X-Timestamp": timestamp,
    "X-Signature": signature,
  };
}
