import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RetroModule } from './modules/retro.module';
import { DashboardController } from './controllers/dashboard.controller';
import { Retro } from './entities/retro.entity';
import { RetroItem } from './entities/retro-item.entity';
import { Participant } from './entities/participant.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Retro, RetroItem, Participant],
      synchronize: false, // Set to false in production
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
      } : false,
    }),
    RetroModule,
  ],
  controllers: [AppController, DashboardController],
  providers: [AppService],
})
export class AppModule {}
