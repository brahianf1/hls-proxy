import { z } from 'zod';
import 'dotenv/config'; // Ensure env vars are loaded

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  API_KEY: z.string(),
  RESOLVER_BASE_URL: z.string().url(),
  RESOLVER_API_KEY: z.string(),
  CORS_ORIGINS: z.string().transform((val) => val.split(',').map((s) => s.trim())),
  ACCEPT_LANGUAGE: z.string().default('en-US,en;q=0.8'),
  SESSION_TTL_S: z.coerce.number().default(900),
  SOURCE_MAP_PATH: z.string().optional(),
  SOURCE_MAP_JSON: z.string().optional(),
  APP_PUBLIC_URL: z.string().url().default('http://localhost:8000'),
}).refine((data) => data.SOURCE_MAP_PATH || data.SOURCE_MAP_JSON, {
  message: 'Either SOURCE_MAP_PATH or SOURCE_MAP_JSON must be provided.',
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
