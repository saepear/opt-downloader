/**
 * Bus de progreso para jobs de descarga. Cada job tiene un `jobId` y emite
 * eventos `update` cada vez que cambia su estado. El endpoint SSE
 * `/api/progress/[jobId]` se suscribe a este bus y los Route Handlers que
 * lanzan yt-dlp publican en él.
 *
 * Decisión: EventEmitter nativo de Node en lugar de Redis pub/sub porque
 * el proceso es single-instance. Si migramos a multi-instance en Fase 6+,
 * este módulo se reemplaza por un cliente Redis con la misma interfaz.
 */
import { EventEmitter } from "node:events";
import type { DownloadJob } from "./types";

const emitter = new EventEmitter();
// Hasta 1000 listeners para evitar warnings de Node cuando hay muchos
// SSE conectados. Límite arbitrario; con 1000 ya hay over-subscription.
emitter.setMaxListeners(1000);

/**
 * Estado actual de todos los jobs activos. Lo usamos en el endpoint SSE
 * para enviar el último estado cuando un cliente se suscribe tarde.
 *
 * Limit: 1000 jobs vivos. Si el sistema se desborda (ataque), los más
 * viejos se evictan. Aceptable porque cada job dura minutos como mucho.
 */
const MAX_JOBS = 1000;
const jobs = new Map<string, DownloadJob>();

export function publishUpdate(job: DownloadJob): void {
  jobs.set(job.id, job);
  if (jobs.size > MAX_JOBS) {
    // Evict el más viejo por createdAt descendente (sencillo: el primero
    // que entró). Como no guardamos createdAt en DownloadJob, usamos la
    // primera key del Map (orden de inserción).
    const firstKey = jobs.keys().next().value;
    if (firstKey) jobs.delete(firstKey);
  }
  emitter.emit("update", job);
}

export function getJob(jobId: string): DownloadJob | undefined {
  return jobs.get(jobId);
}

export function deleteJob(jobId: string): void {
  jobs.delete(jobId);
  // Avisamos a los listeners que este job ya no existe (significa que el
  // archivo fue consumido o el job expiró). Usamos unknown porque solo
  // necesitamos id + status para que el SSE decida cerrarse.
  emitter.emit("update", {
    id: jobId,
    url: "",
    format: "mp3-320",
    progress: 0,
    status: "removed",
  } as DownloadJob);
}

/**
 * Devuelve una función `unsubscribe` para limpiar listeners cuando el
 * cliente SSE se desconecta (importante para no leakear memoria).
 */
export function subscribe(
  jobId: string,
  onUpdate: (job: DownloadJob) => void
): () => void {
  // Si el job ya existe, enviamos su estado actual primero.
  const current = jobs.get(jobId);
  if (current) {
    // setImmediate para que el callback se ejecute en el siguiente tick,
    // igual que cualquier update posterior. Evita carreras en el cliente.
    setImmediate(() => onUpdate(current));
  }

  const handler = (job: DownloadJob) => {
    if (job.id !== jobId) return;
    onUpdate(job);
  };

  emitter.on("update", handler);
  return () => emitter.off("update", handler);
}