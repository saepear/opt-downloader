import { NextResponse } from "next/server";
import { execSync } from "node:child_process";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { stat } from "node:fs/promises";

export async function GET() {
  const checks: Record<string, string> = {};

  // DB reachable
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = "ok";
  } catch {
    checks.db = "error";
  }

  // yt-dlp
  try {
    execSync(`${env.YT_DLP_BIN} --version`, { timeout: 5000, stdio: "pipe" });
    checks.ytdlp = "ok";
  } catch {
    checks.ytdlp = "error";
  }

  // ffmpeg
  try {
    execSync(`${env.FFMPEG_BIN} -version`, { timeout: 5000, stdio: "pipe" });
    checks.ffmpeg = "ok";
  } catch {
    checks.ffmpeg = "error";
  }

  // disk space (> 1 GB free on DOWNLOAD_DIR parent filesystem)
  try {
    await stat(env.DOWNLOAD_DIR);
    // We use `df` for free space; portable across Linux/macOS
    const dfOut = execSync(`df -B1 "${env.DOWNLOAD_DIR}"`, { timeout: 3000, stdio: "pipe" })
      .toString().trim().split("\n").pop()?.split(/\s+/);
    const freeBytes = dfOut ? Number(dfOut[3]) : 0;
    checks.disk = freeBytes > 1_073_741_824 ? "ok" : "low";
  } catch {
    checks.disk = "unknown";
  }

  const healthy = Object.values(checks).every((v) => v === "ok");
  return NextResponse.json(
    { status: healthy ? "healthy" : "degraded", checks },
    { status: healthy ? 200 : 503 }
  );
}
