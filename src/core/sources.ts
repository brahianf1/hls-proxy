import { promises as fs } from 'fs';
import { env } from '../config/env.js';
import { logger } from './observability/logger.js';

let sourceMap: Map<string, string> = new Map();

async function loadSources() {
  if (env.SOURCE_MAP_JSON) {
    logger.info('Loading sources from SOURCE_MAP_JSON environment variable.');
    try {
      const sources = JSON.parse(env.SOURCE_MAP_JSON);
      sourceMap = new Map(Object.entries(sources));
    } catch (error) {
      logger.error('Failed to parse SOURCE_MAP_JSON', error);
      process.exit(1);
    }
  } else if (env.SOURCE_MAP_PATH) {
    logger.info(`Loading sources from ${env.SOURCE_MAP_PATH}`);
    try {
      const fileContent = await fs.readFile(env.SOURCE_MAP_PATH, 'utf-8');
      const sources = JSON.parse(fileContent);
      sourceMap = new Map(Object.entries(sources));
    } catch (error) {
      logger.error(`Failed to load or parse source map file at ${env.SOURCE_MAP_PATH}`, error);
      process.exit(1);
    }
  }
  logger.info(`Loaded ${sourceMap.size} sources.`);
}

export async function getOriginalUrl(sourceId: string): Promise<string | undefined> {
  if (sourceMap.size === 0) {
    await loadSources();
  }
  return sourceMap.get(sourceId);
}

// Initial load
loadSources().catch(err => logger.error(err));
