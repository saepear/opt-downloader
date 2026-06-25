import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { cleanupOldDownloads } from "@/lib/cleanup";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST() {
  const headersList = await headers();
  const auth = headersList.get("authorization")?.replace("Bearer ", "");

  if (!CRON_SECRET || auth !== CRON_SECRET) {
    return NextResponse.json(
      { error: "unauthorized", message: "Invalid or missing CRON_SECRET" },
      { status: 401 }
    );
  }

  const removed = await cleanupOldDownloads(24);
  return NextResponse.json({ ok: true, removed });
}
