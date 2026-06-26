import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const recent = await prisma.download.findMany({
    where: { status: "completed" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      title: true,
      platform: true,
      format: true,
      createdAt: true,
    },
  });

  return NextResponse.json(recent);
}
