/**
 * Rate limit por IP, in-memory. Apropiado para una sola instancia de Node
 * (single-server deploy); para multi-instancia migrar a Redis en Fase 6+.
 *
 * Decisiones:
 * - Ventana fija de 1 minuto. No usamos sliding window porque es overkill
 *   para defenderse de abuso, no para conteo preciso.
 * - El bucket se reinicia cuando el proceso arranca. En serverless esto
 *   sería problemático, pero vamos long-lived en Node.
 * - Identificamos al cliente por `x-forwarded-for` (primera IP) si está
 *   presente, si no por `req.ip` o `req.socket.remoteAddress`. Confiamos
 *   en que el deploy final tenga un proxy que setee el header.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  /** Cuántos requests lleva en la ventana actual. */
  count: number;
  /** Segundos hasta que se reinicie el bucket (0 si está OK). */
  retryAfter: number;
}

/**
 * Intenta consumir un slot para `key` dentro de `windowMs`. Si la IP ya
 * agotó su quota, devuelve `ok: false` con `retryAfter` para el header
 * `Retry-After`.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  // Sin bucket o bucket expirado → crear uno nuevo.
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, count: 1, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      count: bucket.count,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count++;
  return { ok: true, count: bucket.count, retryAfter: 0 };
}

/**
 * Extrae la IP del cliente. Prioriza `x-forwarded-for` (primer valor) que
 * es lo que pone un reverse proxy. Si no hay, usa `remoteAddress` del socket.
 */
export function clientIpFromHeaders(
  forwardedFor: string | null,
  remoteAddress: string | null
): string {
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return remoteAddress ?? "unknown";
}

/**
 * Test helper: limpia todos los buckets. No usar en producción.
 */
export function _resetAllBuckets(): void {
  buckets.clear();
}