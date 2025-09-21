import { z } from 'zod';

// --- Resolver Service Contract ---

export const ResolverResponseSchema = z.object({
  sessionId: z.string(),
  pageUrl: z.string().url(),
  detectedAt: z.string().datetime(),
  streams: z.array(z.object({
    type: z.literal('HLS'),
    masterUrl: z.string().url(),
    isLive: z.boolean().nullable().optional(),
  })),
  requiredHeaders: z.record(z.string()),
  requiredCookies: z.array(z.object({
    name: z.string(),
    value: z.string(),
    domain: z.string().optional(),
    path: z.string().optional(),
    expires: z.number().optional(),
    httpOnly: z.boolean().optional(),
    secure: z.boolean().optional(),
  })).optional(),
});

export type ResolverResponseDto = z.infer<typeof ResolverResponseSchema>;
