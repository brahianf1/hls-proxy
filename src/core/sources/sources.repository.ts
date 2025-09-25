import { supabase } from '../db/supabase.js';
import { logger } from '../observability/logger.js';

// We define a type for our source data based on the table schema
// This improves type safety across the application.
export interface Source {
  id: string;
  key: string;
  name: string | null;
  source_url: string;
  is_active: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

const TABLE_NAME = 'sources';

/**
 * Finds a single source by its unique key.
 * @param key The key of the source to find (e.g., 'source-123').
 * @returns The source object or null if not found.
 */
export async function findSourceByKey(key: string): Promise<Source | null> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('key', key)
    .single();

  if (error) {
    logger.error({ error, key }, 'Error fetching source by key');
    return null;
  }
  return data;
}

/**
 * Retrieves all sources from the database.
 * @returns An array of source objects.
 */
export async function getAllSources(): Promise<Source[]> {
  const { data, error } = await supabase.from(TABLE_NAME).select('*');

  if (error) {
    logger.error({ error }, 'Error fetching all sources');
    return [];
  }
  return data || [];
}

/**
 * Checks if a source with the given URL already exists.
 * @param sourceUrl The URL to check.
 * @returns The existing source object or null if it doesn't exist.
 */
export async function findSourceByUrl(sourceUrl: string): Promise<Source | null> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('source_url', sourceUrl)
    .single();
  
  // An error is expected if no record is found, so we only log real errors
  if (error && error.code !== 'PGRST116') {
    logger.error({ error, sourceUrl }, 'Error fetching source by URL');
    return null;
  }
  return data;
}

/**
 * Creates a new source in the database.
 * It automatically generates a new sequential key (e.g., source-101, source-102).
 * @param sourceData The data for the new source.
 * @returns The newly created source object.
 */
export async function createSource(sourceData: { source_url: string; name?: string; metadata?: Record<string, any> }): Promise<Source | null> {
  // 1. Find the latest source key to generate the next one
  const { data: latestSource, error: latestError } = await supabase
    .from(TABLE_NAME)
    .select('key')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (latestError && latestError.code !== 'PGRST116') { // PGRST116 means no rows found, which is ok
    logger.error({ error: latestError }, 'Error fetching latest source key');
    return null;
  }

  let nextKeyNumber = 1;
  if (latestSource) {
    const lastNumber = parseInt(latestSource.key.split('-')[1]);
    if (!isNaN(lastNumber)) {
      nextKeyNumber = lastNumber + 1;
    }
  }
  const newKey = `source-${nextKeyNumber}`;

  // 2. Insert the new source
  const { data: newSource, error: insertError } = await supabase
    .from(TABLE_NAME)
    .insert([{ 
      key: newKey, 
      source_url: sourceData.source_url, 
      name: sourceData.name,
      metadata: sourceData.metadata
    }])
    .select()
    .single();

  if (insertError) {
    logger.error({ error: insertError, sourceData }, 'Error creating new source');
    return null;
  }

  return newSource;
}

/**
 * Updates an existing source.
 * @param key The key of the source to update.
 * @param updateData The data to update.
 * @returns The updated source object.
 */
export async function updateSource(key: string, updateData: Partial<Pick<Source, 'name' | 'source_url' | 'is_active' | 'metadata'>>): Promise<Source | null> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updateData)
    .eq('key', key)
    .select()
    .single();

  if (error) {
    logger.error({ error, key, updateData }, 'Error updating source');
    return null;
  }
  return data;
}

/**
 * Deletes a source by its key.
 * @param key The key of the source to delete.
 * @returns The deleted source object.
 */
export async function deleteSource(key: string): Promise<Source | null> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('key', key)
    .select()
    .single();

  if (error) {
    logger.error({ error, key }, 'Error deleting source');
    return null;
  }
  return data;
}
