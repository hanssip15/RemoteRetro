import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

 if (document.tags) {
    document.tags = document.tags
      .map(tag => ({
        ...tag,
        // simpan urutan dengan parsing angka di depan
        order: parseInt(tag.name.split('_')[0]) || 999,
      }))
      .sort((a, b) => a.order - b.order)
      .map(({ order, ...tag }) => tag); // hapus property order sebelum return
  }

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
         tagsSorter: (a: string, b: string) => {
      const order = ['Auth','Dashboard','Retros','Participant','Item','Group','Action','Email',
      ];
      return order.indexOf(a) - order.indexOf(b);
    },
    },
  });

  // Start server
  const port = process.env.PORT || 3001;
  const url = process.env.BASE_URL || `http://localhost:${port}`;
  await app.listen(port);
  console.log(`Application is running on: ${url}`);
  console.log(`Swagger API Reference available at: ${url}/api-docs`);
}
bootstrap();
