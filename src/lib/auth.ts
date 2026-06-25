/**
 * Configuración de NextAuth v4.
 *
 * - Credentials provider: email + password con hash bcrypt (tabla User).
 * - PrismaAdapter: requerido para mantener Session/Account/VerificationToken
 *   en SQLite, aunque la estrategia de sesión es JWT (no usamos tabla Session).
 * - session.strategy = "jwt": más simple para self-hosting; no requiere
 *   lookup a DB en cada request. El id del user vive dentro del token.
 */
import { compare } from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        const ok = await compare(credentials.password, user.passwordHash);
        if (!ok) return null;

        // Devolvemos solo lo que necesitamos en el JWT.
        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    /**
     * Lo que va en el token. Lo añadimos en `signIn` para que el id del user
     * esté disponible en el resto del flujo.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
      }
      return token;
    },
    /**
     * Lo que se expone en `session` al cliente. Importante para Fase 3:
     * `session.user.id` se usa en /api/download y /history.
     */
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};