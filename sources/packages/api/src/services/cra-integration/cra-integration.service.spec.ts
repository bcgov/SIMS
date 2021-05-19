import { Test, TestingModule } from '@nestjs/testing';
import { CraIntegrationService } from './cra-integration.service';

describe('CraIntegrationService', () => {
  let service: CraIntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CraIntegrationService],
    }).compile();

    service = module.get<CraIntegrationService>(CraIntegrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
