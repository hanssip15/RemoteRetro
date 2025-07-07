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
import { User } from './entities/user.entity';
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
      entities: [User, Retro, RetroItem, Participant],
      synchronize: false, // Disable synchronize to avoid schema conflicts
      autoLoadEntities: true,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
      } : false,
      logging: false, // Disable SQL logging
    }),
    RetroModule, // ← TAMBAHKAN INI!
    AuthModule,
    UsersModule,
],
  controllers: [AppController, DashboardController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    console.log('AppModule initialized');
    console.log('Controllers registered:', [AppController, DashboardController].map(c => c.name));
  }
}
