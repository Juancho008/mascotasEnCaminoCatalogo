export const HMAC_MAX_AGE_MS = 5 * 60 * 1000;

function buildHmacPayload(method, pathname, timestamp) {
  return `${method.toUpperCase()}\n${pathname}\n${timestamp}`;
}

async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/**
 * Verifica firma HMAC en headers X-Timestamp y X-Signature.
 * Si no hay secret configurado, permite el acceso (modo abierto).
 */
export async function verifyHmac(request, secret) {
  if (!secret) return true;

  const timestamp = request.headers.get("X-Timestamp");
  const signature = request.headers.get("X-Signature");
  if (!timestamp || !signature) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > HMAC_MAX_AGE_MS) {
    return false;
  }

  const url = new URL(request.url);
  const payload = buildHmacPayload(request.method, url.pathname, timestamp);
  const expected = await hmacSha256Hex(secret, payload);
  return timingSafeEqual(signature.toLowerCase(), expected.toLowerCase());
}
