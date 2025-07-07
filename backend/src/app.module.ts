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
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './module/user.module';
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
      autoLoadEntities: true,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
      } : false,
    }),
    RetroModule, // ← TAMBAHKAN INI!
    AuthModule,
    UsersModule,
],
  controllers: [AppController, DashboardController],
  providers: [AppService],
})
export class AppModule {}
