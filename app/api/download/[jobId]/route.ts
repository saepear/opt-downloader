/**
 * GET /api/download/[jobId]
 *
 * Una vez que el SSE ha notificado status="ready", el cliente llama a este
 * endpoint para obtener el archivo final. El job debe existir en el bus de
 * progreso y tener status="ready".
 */
import { stat, readFile } from "node:fs/promises";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getJob } from "@/lib/progress-bus";
import type { ApiError } from "@/lib/types";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json(
      { error: "unauthorized", message: "Necesitas iniciar sesión" } satisfies ApiError,
      { status: 401 }
    );
  }

  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return Response.json(
      { error: "not_found", message: "El job no existe o expiró" } satisfies ApiError,
      { status: 404 }
    );
  }

  if (job.status !== "ready" || !job.filepath) {
    return Response.json(
      {
        error: "not_ready",
        message: job.status === "error" ? "La descarga falló" : "La descarga aún no está lista",
        status: job.status,
      } satisfies ApiError & { status: string },
      { status: job.status === "error" ? 422 : 425 }
    );
  }

  try {
    const stats = await stat(job.filepath);
    const buffer = await readFile(job.filepath);

    logger.info({ jobId, filepath: job.filepath, bytes: stats.size }, "file_delivered");

    const safeFilename = job.filename?.replace(/[^\w\-. ]+/g, "_") ?? "audio";

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": job.contentType ?? "application/octet-stream",
        "Content-Length": String(stats.size),
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
      },
    });
  } catch (err) {
    logger.error({ jobId, err: (err as Error).message }, "file_read_failed");
    return Response.json(
      { error: "file_missing", message: "El archivo ya no está disponible" } satisfies ApiError,
      { status: 410 }
    );
  }
}
