import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function bootstrap() {

  
  const app = await NestFactory.create(AppModule);
  
  // Enable WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));
  
  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'], // Frontend URLs
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Enable global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const port = process.env.PORT || 3001; // Use 3001 for backend to avoid conflict with frontend
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  
}
bootstrap();
