import Fastify from 'fastify';

const server = Fastify({ logger: true });

server.get('/api/health', async () => ({
  success: true,
  data: { status: 'ok' },
}));

try {
  await server.listen({
    host: process.env.HOST ?? '127.0.0.1',
    port: Number(process.env.PORT ?? 3000),
  });
} catch (error) {
  server.log.error(error);
  process.exitCode = 1;
}
