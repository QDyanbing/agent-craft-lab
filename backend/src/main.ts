import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import { AppConfig } from './config.js';
import { SuccessInterceptor } from './http/success.interceptor.js';
import { invalidDto } from './questionnaires/questionnaire.dto.js';

async function main() {
  const config = AppConfig.fromEnv(process.env);
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register(config),
    new FastifyAdapter({ logger: true }),
    { abortOnError: false, bodyParser: false, logger: ['error', 'warn'] },
  );
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, exceptionFactory: invalidDto }),
  );
  app.useGlobalInterceptors(new SuccessInterceptor());
  app.enableShutdownHooks(['SIGTERM', 'SIGINT']);
  await app.listen(config.port, config.host);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
