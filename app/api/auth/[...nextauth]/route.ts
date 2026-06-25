/**
 * NextAuth v4 Route Handler.
 * La función `GET` y `POST` se montan aquí y se exportan como las route
 * handlers nativas de Next.js. La lógica vive en `src/lib/auth.ts`.
 */
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };