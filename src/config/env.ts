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
  APP_PUBLIC_URL: z.string().url().default('http://localhost:8000'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
