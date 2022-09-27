import { Test, TestingModule } from '@nestjs/testing';
import { SimsDbService } from './sims-db.service';

describe('SimsDbService', () => {
  let service: SimsDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SimsDbService],
    }).compile();

    service = module.get<SimsDbService>(SimsDbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
