import { Test, TestingModule } from '@nestjs/testing';
import { ArchiveDbService } from './archive-db.service';

describe('ArchiveDbService', () => {
  let service: ArchiveDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArchiveDbService],
    }).compile();

    service = module.get<ArchiveDbService>(ArchiveDbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
