require("../../../env_setup");
import { Test, TestingModule } from '@nestjs/testing';
import * as dayjs from 'dayjs';
import { ArchiveDbService } from './archive-db.service';

describe('ArchiveDbService', () => {
  let service: ArchiveDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArchiveDbService],
    }).compile();

    service = module.get<ArchiveDbService>(ArchiveDbService);
    await service.init();
  });

  afterEach(async () => {
    await service.connection.close();
  })

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should init', async () => {
    expect(service.connection).toBeDefined();
  });

  it('should get status', async () => {
    const r: Array<{ permanent_disability_flg: string | null }> = await service.getIndividualPDStatus({ birthdate: dayjs("2000-03-11 00:00:00").toDate(), sin: '123456799' });
    expect(r).toBeDefined();
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].permanent_disability_flg).toBeDefined();
    expect(r[0].permanent_disability_flg).toEqual('Y');
  })
});
