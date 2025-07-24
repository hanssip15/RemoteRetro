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
import { GroupItemEntity } from './entities/group-item.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/user.module';
import { RetroItemsModule } from './modules/item.module';
import { RetroItemsService } from './services/item.service';
import { ParticipantGateway } from './gateways/participant.gateways';
import { GroupItemModule } from './modules/group-item.module';
import { GroupModule } from './modules/group.module';
import { ActionModule } from './modules/action.module';
import { EmailService } from './services/email.service';
import { EmailController } from './controllers/email.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      // host: process.env.POSTGRES_HOST,     // 'ag.cnt.id'
      // port: parseInt(process.env.POSTGRES_PORT || '5432', 10), // ubah string ke number ✅
      // username: process.env.POSTGRES_USER, // 'retrosprint'
      // password: process.env.POSTGRES_PASSWORD, // 'BismillahBisa123!'
      // database: process.env.POSTGRES_DB,   // 'retrosprintdb'
      entities: [User, Retro, RetroItem, Participant],
      synchronize: false,
      autoLoadEntities: true,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
      } : false,
      logging: false,
    }),
    TypeOrmModule.forFeature([RetroItem, Retro, Participant, GroupItemEntity]),
    RetroModule, // ← TAMBAHKAN INI!
    AuthModule,
    UsersModule,
    RetroItemsModule,
    GroupItemModule,
    GroupModule,  
    ActionModule
  ],
  controllers: [AppController, DashboardController, EmailController],
  providers: [AppService, RetroItemsService, ParticipantGateway, EmailService],
})
export class AppModule {
  constructor() {
  }
}
