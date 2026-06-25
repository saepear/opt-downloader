/**
 * SSE endpoint: el cliente abre una conexión y recibe actualizaciones
 * en tiempo real del job de descarga.
 *
 * Formato: text/event-stream estándar.
 * Cada evento: `data: <json>\n\n`
 * El stream se cierra cuando status = ready | error | removed.
 */
import { subscribe, getJob } from "@/lib/progress-bus";
import type { DownloadJob } from "@/lib/types";

export const dynamic = "force-dynamic";
export const preferredRegion = "auto";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();

      function send(job: DownloadJob) {
        try {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(job)}\n\n`));
        } catch {
          // stream closed
        }
      }

      // Estado actual (si el job ya existe)
      const current = getJob(jobId);
      if (current) send(current);

      // Suscripción a updates futuros
      const unsubscribe = subscribe(jobId, (update) => {
        send(update);

        if (
          update.status === "ready" ||
          update.status === "error" ||
          update.status === "removed"
        ) {
          unsubscribe();
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      });

      // Limpiar si el cliente se desconecta
      req.signal.addEventListener("abort", () => {
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
