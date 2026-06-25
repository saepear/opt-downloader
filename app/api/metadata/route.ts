import { NextResponse } from "next/server";
import { z } from "zod";
import { detectContentType, fetchPlaylistEntries } from "@/lib/ytdlp";
import { humanizeYtdlpError } from "@/lib/ytdlp-errors";
import { logger } from "@/lib/logger";
import type { ApiError } from "@/lib/types";

const Query = z.object({
  url: z.string().url(),
});

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Query.safeParse(Object.fromEntries(url.searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_url", message: "URL inválida" } satisfies ApiError,
      { status: 400 }
    );
  }

  const { url: targetUrl } = parsed.data;

  try {
    const media = await detectContentType(targetUrl);

    if (media.type === "video") {
      return NextResponse.json({
        type: "video",
        title: media.metadata.title,
        duration: media.metadata.duration,
        uploader: media.metadata.uploader,
      });
    }

    // Es playlist — obtener entries completos
    const entries = await fetchPlaylistEntries(targetUrl);

    logger.info(
      { url: targetUrl, count: entries.length, title: media.info.playlistTitle },
      "playlist_detected"
    );

    return NextResponse.json({
      type: "playlist",
      playlistTitle: media.info.playlistTitle,
      playlistCount: media.info.playlistCount,
      entries: entries.slice(0, 50), // max 50 para no saturar respuesta
    });
  } catch (err) {
    const human = humanizeYtdlpError(err);
    logger.warn({ url: targetUrl, code: human.code }, "metadata_failed");
    return NextResponse.json(
      { error: "metadata_failed", message: human.message, code: human.code } satisfies ApiError,
      { status: human.httpStatus }
    );
  }
}
