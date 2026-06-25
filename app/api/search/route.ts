import { NextResponse } from "next/server";
import { z } from "zod";
import { searchTracks, formatDuration } from "@/lib/search";
import type { ApiError } from "@/lib/types";

const Query = z.object({
  q: z.string().min(1, "Query requerida").max(200),
  limit: z.coerce.number().int().min(1).max(20).default(3),
});

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Query.safeParse(Object.fromEntries(url.searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_query",
        message: "Parámetros inválidos",
        details: parsed.error.flatten(),
      } satisfies ApiError,
      { status: 400 }
    );
  }

  const { q, limit } = parsed.data;

  try {
    const results = await searchTracks(q, limit);
    const items = results.map((r) => ({
      ...r,
      durationLabel: formatDuration(r.durationSec),
    }));

    return NextResponse.json({ items, query: q });
  } catch (err) {
    return NextResponse.json(
      {
        error: "search_failed",
        message: (err as Error).message || "Error al buscar",
      } satisfies ApiError,
      { status: 502 }
    );
  }
}
