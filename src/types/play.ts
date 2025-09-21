import { z } from 'zod';

export const PlayRequestQuery = z.object({
  sourceId: z.string().min(1),
});
export type TPlayRequestQuery = z.infer<typeof PlayRequestQuery>;

export const PlayResponseSchema = z.object({
  sessionId: z.string(),
  playbackUrl: z.string(),
  fullPlaybackUrl: z.string().url(),
});
export type TPlayResponse = z.infer<typeof PlayResponseSchema>;

export const ErrorResponseSchema = z.object({
  error: z.string(),
});
export type TErrorResponse = z.infer<typeof ErrorResponseSchema>;
