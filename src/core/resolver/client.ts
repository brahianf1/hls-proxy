import { env } from '../../config/env.js';
import { logger } from '../observability/logger.js';
import { ResolverResponseSchema, ResolverResponseDto } from '../../types/dto.js';
import { resolverErrorCounter } from '../observability/metrics.js';

async function resolve(sourceId: string, originalUrl: string): Promise<ResolverResponseDto | null> {
  const resolverUrl = `${env.RESOLVER_BASE_URL}/api/v1/resolve`;
  logger.info(`Calling resolver for sourceId: ${sourceId} at ${resolverUrl}`);

  try {
    const response = await fetch(resolverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': env.RESOLVER_API_KEY,
      },
      body: JSON.stringify({ url: originalUrl }),
    });

    if (!response.ok) {
      logger.error(`Resolver returned status: ${response.status} for sourceId: ${sourceId}`);
      resolverErrorCounter.inc({ sourceId, reason: `http_${response.status}` });
      return null;
    }

    const data = await response.json();
    const validation = ResolverResponseSchema.safeParse(data);

    if (!validation.success) {
      logger.error(`Invalid response from resolver for sourceId: ${sourceId}`, validation.error.issues);
      resolverErrorCounter.inc({ sourceId, reason: 'invalid_response' });
      return null;
    }

    if (!validation.data.streams || validation.data.streams.length === 0 || !validation.data.streams[0].masterUrl) {
      logger.warn(`Resolver returned no valid HLS streams for sourceId: ${sourceId}`);
      resolverErrorCounter.inc({ sourceId, reason: 'no_hls_stream' });
      return null;
    }

    return validation.data;
  } catch (error: any) {
    logger.error(`Error calling resolver for sourceId: ${sourceId}`, error);
    resolverErrorCounter.inc({ sourceId, reason: 'network_error' });
    return null;
  }
}

export const resolverClient = {
  resolve,
};
