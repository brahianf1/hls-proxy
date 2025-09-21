import { FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../../config/env.js';

export async function apiKeyAuth(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.headers['x-api-key'];
  if (!apiKey || apiKey !== env.API_KEY) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
}
