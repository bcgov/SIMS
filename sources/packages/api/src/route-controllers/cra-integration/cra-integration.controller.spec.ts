import { Test, TestingModule } from '@nestjs/testing';
import { CraIntegrationController } from './cra-integration.controller';

describe('CraIntegrationController', () => {
  let controller: CraIntegrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CraIntegrationController],
    }).compile();

    controller = module.get<CraIntegrationController>(CraIntegrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
