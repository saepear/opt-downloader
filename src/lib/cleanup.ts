import { readdir, stat, unlink, rmdir } from "fs/promises";
import { join } from "path";
import { env } from "./env";
import { logger } from "./logger";

export async function cleanupOldDownloads(retentionHours = 24): Promise<number> {
  const cutoff = Date.now() - retentionHours * 3600 * 1000;
  let removed = 0;

  try {
    const entries = await readdir(env.DOWNLOAD_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dirPath = join(env.DOWNLOAD_DIR, entry.name);
      try {
        const s = await stat(dirPath);
        if (s.mtimeMs < cutoff) {
          await rmRecursive(dirPath);
          removed++;
        }
      } catch {
        // skip if dir was removed concurrently
      }
    }
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }

  logger.info({ removed, retentionHours }, "cleanup_done");
  return removed;
}

async function rmRecursive(dir: string): Promise<void> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const s = await stat(full);
    if (s.isDirectory()) {
      await rmRecursive(full);
    } else {
      await unlink(full);
    }
  }
  await rmdir(dir);
}
