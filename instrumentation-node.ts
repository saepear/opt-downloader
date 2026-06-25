import { cleanupOldDownloads } from "@/lib/cleanup";
import { logger } from "@/lib/logger";

const CLEANUP_INTERVAL_MS = 4 * 3600 * 1000;

logger.info({ intervalMs: CLEANUP_INTERVAL_MS }, "cleanup_scheduler_started");
cleanupOldDownloads(24).catch(() => {});

setInterval(() => {
  cleanupOldDownloads(24).catch((err: unknown) => {
    logger.warn({ err: (err as Error).message }, "cleanup_tick_error");
  });
}, CLEANUP_INTERVAL_MS);
