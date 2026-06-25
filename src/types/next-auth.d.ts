/**
 * Extensiones de tipos para NextAuth v4.
 *
 * Por defecto `session.user` no tiene `id` y `token` no tiene `id`. Como
 * los añadimos en los callbacks de `auth.ts`, le decimos a TypeScript que
 * existen. Sin este archivo `tsc --noEmit` falla.
 */
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}