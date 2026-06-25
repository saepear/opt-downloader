/**
 * Singleton de PrismaClient. En desarrollo Next.js hace HMR que crea
 * múltiples instancias si no se guarda en `globalThis` — Prisma abría
 * muchas conexiones a SQLite hasta agotar file descriptors.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}