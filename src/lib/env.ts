import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  YT_DLP_BIN: z.string().default("/usr/bin/yt-dlp"),
  FFMPEG_BIN: z.string().default("/usr/bin/ffmpeg"),
  DOWNLOAD_DIR: z.string().default("/tmp/mp3-downloader"),
  AUTH_SECRET: z.string().min(32).optional(),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(10),
  MAX_CONCURRENT_DOWNLOADS: z.coerce.number().int().positive().default(2),
  LOG_LEVEL: z.string().default("info"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("[env] invalid environment configuration:", parsed.error.flatten());
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export type Env = typeof env;