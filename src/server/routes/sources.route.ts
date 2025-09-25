import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  findSourceByKey,
  getAllSources,
  createSource,
  updateSource,
  deleteSource,
  findSourceByUrl,
} from '../../core/sources/sources.repository.js';
import { apiKeyAuth } from '../../core/security/api-key.js';

// Zod schema for the Source, used for consistent typing and validation
const SourceSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  name: z.string().nullable(),
  source_url: z.string().url(),
  is_active: z.boolean(),
  metadata: z.record(z.any()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const CreateSourceSchema = z.object({
  source_url: z.string().url(),
  name: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const UpdateSourceSchema = z.object({
    name: z.string().optional(),
    source_url: z.string().url().optional(),
    is_active: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
});

export async function registerSourcesRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // GET /api/v1/sources - List all sources
  server.get('/api/v1/sources', {
    schema: { response: { 200: z.array(SourceSchema) } },
    preHandler: [apiKeyAuth],
  }, async (req, reply) => {
    const sources = await getAllSources();
    return reply.send(sources);
  });

  // POST /api/v1/sources - Create a new source
  server.post('/api/v1/sources', {
    schema: {
      body: CreateSourceSchema,
      response: { 
        201: SourceSchema, 
        409: z.object({ error: z.string(), key: z.string() }),
        500: z.object({ error: z.string() })
      },
    },
    preHandler: [apiKeyAuth],
  }, async (req, reply) => {
    const { source_url } = req.body;

    // Check if source URL already exists
    const existing = await findSourceByUrl(source_url);
    if (existing) {
      return reply.code(409).send({ error: `Source URL already exists.`, key: existing.key });
    }

    const newSource = await createSource(req.body);
    if (!newSource) {
        return reply.code(500).send({ error: 'Failed to create source'});
    }
    return reply.code(201).send(newSource);
  });

  // PUT /api/v1/sources/:key - Update a source
  server.put('/api/v1/sources/:key', {
    schema: {
        params: z.object({ key: z.string() }),
        body: UpdateSourceSchema,
        response: { 200: SourceSchema, 404: z.object({ error: z.string() }) },
    },
    preHandler: [apiKeyAuth],
  }, async (req, reply) => {
    const { key } = req.params;
    const updatedSource = await updateSource(key, req.body);
    if (!updatedSource) {
        return reply.code(404).send({ error: `Source with key '${key}' not found.` });
    }
    return reply.send(updatedSource);
  });

  // DELETE /api/v1/sources/:key - Delete a source
  server.delete('/api/v1/sources/:key', {
    schema: {
        params: z.object({ key: z.string() }),
        response: { 200: SourceSchema, 404: z.object({ error: z.string() }) },
    },
    preHandler: [apiKeyAuth],
  }, async (req, reply) => {
    const { key } = req.params;
    const deletedSource = await deleteSource(key);

    if (!deletedSource) {
        return reply.code(404).send({ error: `Source with key '${key}' not found.` });
    }
    return reply.send(deletedSource);
  });
}
