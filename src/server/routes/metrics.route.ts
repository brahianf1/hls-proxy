import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { registry } from '../../core/observability/metrics.js';

export default async function metricsRoute(server: FastifyInstance) {
  server.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header('Content-Type', registry.contentType);
    return registry.metrics();
  });
}
