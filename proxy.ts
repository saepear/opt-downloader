/**
 * Next 16 renombró `middleware.ts` → `proxy.ts`. Aquí protegemos:
 *
 *   - /api/download   → requiere sesión (descarga autenticada)
 *   - /history        → requiere sesión (historial privado)
 *
 * El resto pasa tal cual. Las páginas de auth (/login, /register) y la
 * landing (/) son públicas.
 *
 * Estrategia: usamos `getToken()` de NextAuth v4 para verificar la cookie
 * de sesión. Es la forma oficial para App Router con middleware/proxy.
 */
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/api/download", "/api/progress", "/history"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    // Para API devolvemos 401 JSON; para páginas redirigimos a /login.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "unauthorized", message: "Necesitas iniciar sesión" },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/download/:path*", "/api/progress/:path*", "/history/:path*"],
};