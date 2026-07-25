import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  // Enable automatic DTO transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 📄 OpenAPI / Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Products Search API')
    .setDescription('High-performance Search & Autocomplete API using Elasticsearch and Redis (Hexagonal Architecture)')
    .setVersion('1.0')
    .addTag('search', 'Endpoints para Búsqueda y Autocompletado')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Servidor corriendo en: http://localhost:${port}/api/v1`);
  console.log(`📄 Documentación Swagger disponible en: http://localhost:${port}/api/docs`);
}
bootstrap();