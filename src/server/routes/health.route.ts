import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface HealthStatus {
  status: string;
  uptime: number;
  version: string;
}

export default async function healthRoute(server: FastifyInstance) {
  server.get('/health', async (request: FastifyRequest, reply: FastifyReply): Promise<HealthStatus> => {
    return {
      status: 'ok',
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown',
    };
  });
}
