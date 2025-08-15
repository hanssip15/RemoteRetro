import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser';
import { RedirectNotFoundFilter } from './common/filters/redirect-not-found-exception.filter';

// Load environment variables
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Cookie parser
  app.use(cookieParser());

  app.useGlobalFilters(new RedirectNotFoundFilter());

  // Enable CORS
  const corsOrigins = process.env.CORS_ORIGIN?.split(',') || [];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'PATCH','POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // --- Swagger & Scalar API Reference setup ---
  const config = new DocumentBuilder()
    .setTitle('My API Reference')
    .setDescription('Auto-generated API docs with Scalar')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Optional Swagger UI setup (akses di /swagger)
  SwaggerModule.setup('swagger', app, document);

  // Scalar documentation (akses di /reference)
  app.use(
    '/reference',
    apiReference({
      spec: {
        content: document,
      },
    }),
  );

  // Start server
  const port = process.env.PORT || 3001;
  const url = process.env.BASE_URL || `http://localhost:${port}`;
  await app.listen(port);
  console.log(`Application is running on: ${url}`);
  console.log(`Scalar API Reference available at: ${url}/reference`);
}
bootstrap();
