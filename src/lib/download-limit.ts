import { prisma } from "@/lib/db";

export const GUEST_LIMIT = 10;
export const USER_LIMIT = 20;

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function limitFor(userId: string | null | undefined): number {
  return userId ? USER_LIMIT : GUEST_LIMIT;
}

export async function checkDownloadLimit(
  ip: string,
  userId?: string | null
): Promise<{ ok: boolean; remaining: number }> {
  const limit = limitFor(userId);
  const date = today();

  const existing = await prisma.dailyLimit.findFirst({
    where: userId ? { userId, date } : { ip, date },
  });

  if (!existing || existing.count < limit) {
    const updated = await prisma.dailyLimit.upsert({
      where: userId
        ? { userId_date: { userId, date } }
        : { ip_date: { ip, date } },
      update: { count: { increment: 1 } },
      create: { ...(userId ? { userId, date } : { ip, date }), count: 1 },
    });
    return { ok: true, remaining: Math.max(0, limit - updated.count) };
  }

  return { ok: false, remaining: 0 };
}

export async function getRemainingDownloads(
  ip: string,
  userId?: string | null
): Promise<number> {
  const limit = limitFor(userId);
  const date = today();

  const existing = await prisma.dailyLimit.findFirst({
    where: userId ? { userId, date } : { ip, date },
  });
  if (!existing) return limit;

  return Math.max(0, limit - existing.count);
}
