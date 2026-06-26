import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getRemainingDownloads } from "@/lib/download-limit";
import { clientIpFromHeaders } from "@/lib/rate-limit";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const ip = clientIpFromHeaders(
    req.headers.get("x-forwarded-for"),
    req.headers.get("x-real-ip") ?? "unknown"
  );
  const remaining = await getRemainingDownloads(ip, session?.user?.id);
  return NextResponse.json({ remaining, limit: session?.user?.id ? 20 : 10 });
}
