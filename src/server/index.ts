import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ZodTypeProvider, validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import { logger } from '../core/observability/logger.js';
import { env } from '../config/env.js';
import healthRoute from './routes/health.route.js';
import metricsRoute from './routes/metrics.route.js';
import { registerPlayRoute } from './routes/play.route.js';
import { loadSources } from '../core/sources/index.js';

async function bootstrap() {
  await loadSources();

  const server = Fastify({
    logger: logger,
  }).withTypeProvider<ZodTypeProvider>();

  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  await server.register(cors, {
    origin: env.CORS_ORIGINS,
  });

  await server.register(healthRoute);
  await server.register(metricsRoute);
  await server.register(registerPlayRoute);

  try {
    await server.listen({ port: env.PORT, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

bootstrap();
