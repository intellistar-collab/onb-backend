import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionCronService } from './subscription-cron.service';

describe('SubscriptionCronService', () => {
  let service: SubscriptionCronService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionCronService],
    }).compile();

    service = module.get<SubscriptionCronService>(SubscriptionCronService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
