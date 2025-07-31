import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser';


// Load environment variables
dotenv.config();

async function bootstrap() {

  
  const app = await NestFactory.create(AppModule);
  
  // Enable WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));
  app.use(cookieParser());
  
  // Enable CORS
  const corsOrigins = process.env.CORS_ORIGIN?.split(',') || [];
  app.enableCors({
    origin: corsOrigins,
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
  const url = process.env.BASE_URL;
  await app.listen(port);
  console.log(`Application is running on: ${url}`);
}
bootstrap();
