import { findSourceByKey } from './sources.repository.js';
import { logger } from '../observability/logger.js';

/**
 * This function is the bridge between the playback route and the data layer.
 * It fetches a source by its ID from the database.
 * 
 * @param sourceId The key of the source to retrieve (e.g., 'source-123').
 * @returns The source URL if found and active, otherwise undefined.
 */
export async function getOriginalUrl(sourceId: string): Promise<string | undefined> {
  logger.debug({ sourceId }, 'Attempting to get original URL for source ID');

  const source = await findSourceByKey(sourceId);

  if (!source) {
    logger.warn({ sourceId }, 'Source ID not found in database');
    return undefined;
  }

  if (!source.is_active) {
    logger.warn({ sourceId, key: source.key }, 'Source is currently disabled');
    return undefined;
  }

  logger.info({ sourceId, url: source.source_url }, 'Successfully retrieved source URL');
  return source.source_url;
}
