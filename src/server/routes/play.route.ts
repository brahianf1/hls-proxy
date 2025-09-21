import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { randomUUID } from 'node:crypto';
import { apiKeyAuth } from '../../core/security/api-key.js';
import { resolverClient } from '../../core/resolver/client.js';
import { getOriginalUrl } from '../../core/sources/index.js';
import { sessionManager } from '../../core/sessions/store.js';
import { sanitizeHeaders } from '../../utils/headers.js';
import { buildCookieHeader } from '../../utils/cookies.js';
import { getOriginBase } from '../../utils/url.js';
import { env } from '../../config/env.js';
import { logger } from '../../core/observability/logger.js';
import { hlsProxyHandlers } from '../../core/proxy/hls.handlers.js';
import { 
  PlayRequestQuery, 
  PlayResponseSchema, 
  ErrorResponseSchema, 
  TPlayRequestQuery, 
  TPlayResponse, 
  TErrorResponse 
} from '../../types/play.js';

async function playHandler(request: any, reply: any) {
  const { sourceId } = request.query;
  const originalUrl = await getOriginalUrl(sourceId);

  if (!originalUrl) {
    return reply.code(404).send({ error: `Source ID not found: ${sourceId}` });
  }

  const resolverResponse = await resolverClient.resolve(sourceId, originalUrl);
  if (!resolverResponse) {
    return reply.code(422).send({ error: 'Failed to resolve a valid HLS stream' });
  }

  const sessionId = randomUUID();
  const masterUrl = resolverResponse.streams[0].masterUrl;
  const originBase = getOriginBase(masterUrl);
  if (!originBase) {
    return reply.code(422).send({ error: 'Could not determine origin from master URL' });
  }

  const upstreamHeaders = sanitizeHeaders(sessionId, resolverResponse.requiredHeaders);
  const cookieHeader = buildCookieHeader(resolverResponse.requiredCookies);

  sessionManager.set({
    sessionId,
    originBase,
    masterUrl,
    upstreamHeaders,
    cookieHeader,
    expiresAt: Date.now() + env.SESSION_TTL_S * 1000,
  });

  const playbackUrl = `/hls/${sessionId}/master.m3u8`;
  const fullPlaybackUrl = `${env.APP_PUBLIC_URL}${playbackUrl}`;
  logger.info({ sessionId, sourceId }, 'Responding with playback URL');
  return reply.code(200).send({ sessionId, playbackUrl, fullPlaybackUrl });
}

export async function registerPlayRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route<{
    Querystring: TPlayRequestQuery;
    Reply: TPlayResponse | TErrorResponse;
  }>({
    method: 'GET',
    url: '/api/v1/play',
    schema: {
      querystring: PlayRequestQuery,
      response: {
        200: PlayResponseSchema,
        404: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    preHandler: [apiKeyAuth],
    handler: playHandler,
  });

  app.get('/hls/:sessionId/master.m3u8', hlsProxyHandlers.masterManifestHandler);
  app.get('/hls/:sessionId/media/*', hlsProxyHandlers.mediaManifestHandler);
  app.get('/hls/:sessionId/segment/*', hlsProxyHandlers.segmentHandler);
}
