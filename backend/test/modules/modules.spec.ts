// app.module.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { DashboardController } from '../../src/controllers/dashboard.controller';
import { EmailController } from '../../src/controllers/email.controller';
import { RetroItemsService } from '../../src/services/item.service';
import { EmailService } from '../../src/services/email.service';

describe('AppModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      // supaya tidak konek ke DB beneran, override TypeOrmModule
      .overrideProvider('DataSource')
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should load DashboardController', () => {
    const controller = module.get<DashboardController>(DashboardController);
    expect(controller).toBeInstanceOf(DashboardController);
  });

  it('should load EmailController', () => {
    const controller = module.get<EmailController>(EmailController);
    expect(controller).toBeInstanceOf(EmailController);
  });

  it('should load RetroItemsService', () => {
    const service = module.get<RetroItemsService>(RetroItemsService);
    expect(service).toBeInstanceOf(RetroItemsService);
  });

  it('should load EmailService', () => {
    const service = module.get<EmailService>(EmailService);
    expect(service).toBeInstanceOf(EmailService);
  });
});
