import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const API_PREFIX = 'api/v1';
  app.setGlobalPrefix(API_PREFIX, {
    exclude: ['/api/docs', '/health'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Products Search API')
    .setDescription(
      'Search and Autocomplete Service using NestJS, Elasticsearch, and Redis',
    )
    .setVersion('1.0')
    .addTag('Search')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const SWAGGER_PATH = 'api/docs';
  SwaggerModule.setup(SWAGGER_PATH, app, document);

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, '0.0.0.0');

  logger.log(`🚀 API corriendo en: http://0.0.0.0:${PORT}/${API_PREFIX}`);
  logger.log(
    `📄 Swagger disponible en: http://0.0.0.0:${PORT}/${SWAGGER_PATH}`,
  );
}

bootstrap();
